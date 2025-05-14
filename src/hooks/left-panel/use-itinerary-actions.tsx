
import { useState } from 'react';
import { Place, SchedulePayload } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay } from '../use-itinerary-creator';
import { useScheduleGenerator } from '../use-schedule-generator';
import { toast } from 'sonner';

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
      
      const generatedItinerary = createItinerary(
        placesToUse,
        startDate,
        endDate,
        startTime,
        endTime
      );
      
      if (generatedItinerary.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return null;
      }
      
      setItinerary(generatedItinerary);
      setSelectedItineraryDay(1); // 항상 첫 번째 일차를 기본으로 선택
      setShowItinerary(true);
      
      console.log("일정 생성 완료:", {
        일수: generatedItinerary.length,
        총장소수: generatedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: generatedItinerary[0]?.places.map(p => p.name).join(', ')
      });
      
      return generatedItinerary;
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return null;
    }
  };

  // 서버로 일정 생성 요청하는 함수
  const handleServerItineraryCreation = async (payload: SchedulePayload) => {
    try {
      toast.loading("서버에 일정 생성 요청 중...");
      
      const serverResponse = await generateSchedule(payload);
      
      if (!serverResponse || !serverResponse.itinerary || serverResponse.itinerary.length === 0) {
        toast.error("서버에서 일정을 받아오지 못했습니다.");
        return null;
      }
      
      // 서버 응답을 클라이언트 형식으로 변환
      const formattedItinerary = serverResponse.itinerary.map((dayData: any) => {
        return {
          day: dayData.day,
          places: dayData.places,
          totalDistance: dayData.total_distance || 0,
          // 새로운 경로 데이터 포맷 추가
          routeData: {
            nodeIds: dayData.route_data?.node_ids || [],
            linkIds: dayData.route_data?.link_ids || [],
            segmentRoutes: dayData.segment_routes || []
          }
        };
      });
      
      console.log("서버로부터 일정 수신 완료:", {
        일수: formattedItinerary.length,
        경로정보포함: formattedItinerary.some(day => 
          day.routeData && 
          (day.routeData.nodeIds.length > 0 || day.routeData.linkIds.length > 0)
        )
      });
      
      // 일정 상태 업데이트
      setItinerary(formattedItinerary);
      setSelectedItineraryDay(1); // 항상 첫 번째 일차 선택
      
      toast.success(`${formattedItinerary.length}일 일정이 생성되었습니다!`);
      return formattedItinerary;
    } catch (error) {
      console.error("서버 일정 생성 오류:", error);
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
    
    // 서버 API를 통한 일정 생성
    if (payload) {
      console.log("서버 API를 통한 일정 생성 시도");
      return handleServerItineraryCreation(payload);
    }
    
    // 로컬 알고리즘을 통한 일정 생성 (기존 방식, 폴백)
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
      setShowItinerary(true); // 명시적으로 일정 패널을 표시하도록 설정
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
