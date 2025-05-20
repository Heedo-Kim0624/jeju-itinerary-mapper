import { useState } from 'react';
import { Place, SchedulePayload, ItineraryPlaceWithTime, CategoryName, ItineraryDay } from '@/types/core'; // ItineraryDay 임포트 경로 수정 및 타입 사용
// use-itinerary-creator에서 ItineraryDay는 더 이상 export하지 않음
// import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '../use-itinerary-creator';
import { useItineraryCreator } from '../use-itinerary-creator';
import { useScheduleGenerator } from '../use-schedule-generator';
import { toast } from 'sonner';
import { NewServerScheduleResponse, isNewServerScheduleResponse, ServerScheduleItem } from '@/types/schedule';
import { getDateStringMMDD, getDayOfWeekString } from '@/hooks/itinerary/itineraryUtils'; // 날짜 유틸리티 함수 임포트

export const useItineraryActions = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();
  const { generateSchedule, isGenerating } = useScheduleGenerator();

  const handleSelectItineraryDay = (day: number) => {
    console.log('일정 일자 선택:', day);
    setSelectedItineraryDay(day);
  };

  const generateItinerary = (
    placesToUse: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ) => {
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return null;
      }
    
      console.log('일정 생성 시작', {
        장소수: placesToUse.length,
        시작일: startDate,
        종료일: endDate,
        시작시간: startTime,
        종료시간: endTime
      });
      
      const generatedItineraryFromCreator = createItinerary( // 변수명 변경하여 타입 혼동 방지
        placesToUse,
        startDate,
        endDate,
        startTime,
        endTime
      );
      
      if (generatedItineraryFromCreator.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return null;
      }

      // CreatorItineraryDay[] (실제로는 Core ItineraryDay와 거의 유사)를 ItineraryDay[]로 변환 (dayOfWeek, date 추가)
      const finalGeneratedItinerary: ItineraryDay[] = generatedItineraryFromCreator.map((dayData, index) => {
        const currentDayDt = new Date(startDate);
        currentDayDt.setDate(startDate.getDate() + index);
        return {
          ...dayData,
          dayOfWeek: getDayOfWeekString(currentDayDt),
          date: getDateStringMMDD(currentDayDt),
          // routeData와 interleaved_route는 useItineraryCreatorCore에서 이미 기본값으로 채워져 있을 수 있음
          // 만약 없다면 여기서 기본값을 제공해야 함
          routeData: dayData.routeData || { nodeIds: [], linkIds: [], segmentRoutes: [] },
          interleaved_route: dayData.interleaved_route || [],
        };
      });
      
      setItinerary(finalGeneratedItinerary);
      setSelectedItineraryDay(1); // 항상 첫 번째 일차를 기본으로 선택
      setShowItinerary(true);
      
      console.log("일정 생성 완료:", {
        일수: finalGeneratedItinerary.length,
        총장소수: finalGeneratedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: finalGeneratedItinerary[0]?.places.map(p => p.name).join(', ')
      });
      
      return finalGeneratedItinerary;
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return null;
    }
  };

  // 서버로 일정 생성 요청하는 함수
  const handleServerItineraryCreation = async (payload: SchedulePayload, tripStartDate: Date) => {
    try {
      toast.loading("서버에 일정 생성 요청 중...");
      
      const serverResponse = await generateSchedule(payload);
      
      if (!serverResponse || !isNewServerScheduleResponse(serverResponse) || 
          !serverResponse.schedule || serverResponse.schedule.length === 0 || 
          !serverResponse.route_summary || serverResponse.route_summary.length === 0) {
        toast.error("서버에서 일정을 받아오지 못했거나, 내용이 비어있습니다.");
        console.warn("[handleServerItineraryCreation] Invalid server response:", serverResponse);
        return null;
      }
      
      const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      // const tripStartDayOfWeek = tripStartDate.getDay(); // 이 변수는 직접 사용되지 않고, 날짜 계산에 tripStartDate가 사용됨

      const formattedItinerary: ItineraryDay[] = serverResponse.route_summary.map((summary, index) => {
        // 날짜 계산 로직 (useScheduleParser.ts와 유사하게)
        const routeDayAbbrev = summary.day.substring(0, 3);
        const routeDayOfWeekIndex = dayOfWeekMap[routeDayAbbrev];
        const tripStartDayOfWeekIndex = tripStartDate.getDay();
        let dayNumberOffset = routeDayOfWeekIndex - tripStartDayOfWeekIndex;
        if (dayNumberOffset < 0) dayNumberOffset += 7;
        
        const currentTripDate = new Date(tripStartDate);
        // summary.day가 "Mon (Day 1)" 형식일 수 있으므로, 순수 요일만 사용하고 실제 날짜는 tripStartDate와 index 기반으로 계산
        // 또는 서버 응답의 dayIndex나 유사한 값을 사용해야 정확한 날짜 매핑 가능
        // 여기서는 route_summary의 순서(index)를 기반으로 날짜를 계산합니다.
        currentTripDate.setDate(tripStartDate.getDate() + dayNumberOffset + Math.floor(index / 7) * 7); // 주차 고려
        // 더 정확한 날짜 계산을 위해서는 서버 응답에 `day_offset_from_trip_start` 같은 필드가 있으면 좋음
        // 임시로, route_summary의 순서(index)를 여행 시작일로부터의 offset으로 사용한다고 가정.
        const actualDayDate = new Date(tripStartDate);
        actualDayDate.setDate(tripStartDate.getDate() + index);


        const placeNodeIdsInRoute = summary.interleaved_route
            .filter((id, idx) => idx % 2 === 0)
            .map(id => String(id));

        const dayPlaces = serverResponse.schedule
            .filter(item => {
                const itemIdStr = item.id !== undefined ? String(item.id) : null;
                // schedule item의 time_block (e.g., "Mon_09")과 summary.day (e.g., "Mon (Day 1)")의 요일 부분이 일치하는지 확인
                const scheduleItemDayAbbrev = item.time_block.substring(0, 3);
                return itemIdStr && placeNodeIdsInRoute.includes(itemIdStr) && scheduleItemDayAbbrev === routeDayAbbrev;
            })
            .map((item: ServerScheduleItem) => ({
                id: item.id?.toString() || item.place_name,
                name: item.place_name,
                category: item.place_type as CategoryName, 
                timeBlock: item.time_block,
                x:0, y:0, address:'', phone:'', description:'', rating:0, image_url:'', road_address:'', homepage:'',
                isSelected: false, isCandidate: false, 
            } as ItineraryPlaceWithTime));

        // tripDayNumber는 1부터 시작하도록 index + 1
        const tripDayNumber = index + 1;

        return {
          day: tripDayNumber,
          places: dayPlaces,
          totalDistance: summary.total_distance_m / 1000,
          interleaved_route: summary.interleaved_route,
          routeData: { 
            nodeIds: placeNodeIdsInRoute,
            linkIds: summary.interleaved_route.filter((_, idx) => idx % 2 !== 0).map(String),
            // segmentRoutes는 서버에서 직접 제공되지 않으므로 기본값 설정
            segmentRoutes: [], 
          },
          dayOfWeek: getDayOfWeekString(actualDayDate), // 계산된 날짜 사용
          date: getDateStringMMDD(actualDayDate),      // 계산된 날짜 사용
        };
      });
      
      console.log("서버로부터 일정 수신 완료 (useItineraryActions):", {
        일수: formattedItinerary.length,
      });
      
      setItinerary(formattedItinerary);
      if (formattedItinerary.length > 0) {
        setSelectedItineraryDay(formattedItinerary[0].day as number);
      }
      
      toast.success(`${formattedItinerary.length}일 일정이 생성되었습니다!`);
      return formattedItinerary;
    } catch (error) {
      console.error("서버 일정 생성 오류 (useItineraryActions):", error);
      toast.error("서버에서 일정을 생성하는데 실패했습니다.");
      return null;
    }
  };

  // 경로 생성 핸들러
  const handleCreateItinerary = (
    selectedPlaces: Place[], 
    dates: {
      startDate: Date;
      endDate: Date;
      startTime: string;
      endTime: string;
    } | null,
    payload?: SchedulePayload
  ) => {
    if (!dates) {
      console.error('경로 생성 실패: 날짜 정보가 없습니다.');
      toast.error("여행 날짜를 설정해주세요!");
      return null;
    }
    
    if (selectedPlaces.length === 0) {
      console.error('경로 생성 실패: 선택된 장소가 없습니다.');
      toast.error("장소를 먼저 선택해주세요!");
      return null;
    }
    
    console.log("경로 생성 시작:", {
      장소수: selectedPlaces.length,
      날짜: dates
    });
    
    if (payload && dates?.startDate) {
      console.log("서버 API를 통한 일정 생성 시도 (useItineraryActions)");
       handleServerItineraryCreation(payload, dates.startDate).then(result => {
         if (result) {
           setShowItinerary(true);
         }
       });
       return null; 
    }
    
    console.log("로컬 알고리즘을 통한 일정 생성 (폴백)");
    const result = generateItinerary(
      selectedPlaces,
      dates.startDate,
      dates.endDate,
      dates.startTime,
      dates.endTime
    );
    
    if (result) {
      toast.success("일정이 성공적으로 생성되었습니다!");
      setShowItinerary(true);
    }
    
    return result;
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    handleCreateItinerary,
    isGenerating
  };
};
