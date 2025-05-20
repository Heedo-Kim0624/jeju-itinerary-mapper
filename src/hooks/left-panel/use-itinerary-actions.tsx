
import { useState } from 'react';
import { Place, SchedulePayload, ItineraryDay } from '@/types/core';
import { useItineraryCreator } from '../use-itinerary-creator';
import { useScheduleGenerator } from '../use-schedule-generator';
import { toast } from 'sonner';
import { NewServerScheduleResponse, isNewServerScheduleResponse } from '@/types/schedule'; // NewServerScheduleResponse는 schedule에서 가져옴
import { formatClientItinerary } from './itinerary-logic/formatClientItinerary';
import { formatServerItinerary } from './itinerary-logic/formatServerItinerary';
import { getDateStringMMDD, getDayOfWeekString } from '@/hooks/itinerary/itineraryUtils';


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

  // Internal function for client-side generation flow
  const generateLocalItinerary = (
    placesToUse: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] | null => {
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return null;
      }
    
      console.log('[useItineraryActions] 로컬 일정 생성 시작', {
        장소수: placesToUse.length,
        시작일: startDate,
        종료일: endDate,
        시작시간: startTime,
        종료시간: endTime
      });
      
      const generatedItineraryFromCreator = createItinerary(
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
      
      // 날짜 및 요일 정보 추가
      const finalGeneratedItinerary = generatedItineraryFromCreator.map((dayData, index) => {
        const currentDayDt = new Date(startDate);
        currentDayDt.setDate(startDate.getDate() + index);
        return {
          ...dayData,
          dayOfWeek: getDayOfWeekString(currentDayDt),
          date: getDateStringMMDD(currentDayDt),
        };
      });
      
      setItinerary(finalGeneratedItinerary);
      setSelectedItineraryDay(1); 
      setShowItinerary(true);
      
      console.log("[useItineraryActions] 로컬 일정 생성 완료:", {
        일수: finalGeneratedItinerary.length,
        총장소수: finalGeneratedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: finalGeneratedItinerary[0]?.places.map(p => p.name).join(', ')
      });
      
      return finalGeneratedItinerary;
    } catch (error) {
      console.error("[useItineraryActions] 로컬 일정 생성 오류:", error);
      toast.error("로컬 일정 생성 중 오류가 발생했습니다.");
      return null;
    }
  };

  // Internal function for server-side generation flow
  const createServerItinerary = async (
    payload: SchedulePayload,
    tripStartDate: Date,
    originalSelectedPlaces: Place[] // 추가된 파라미터
  ): Promise<ItineraryDay[] | null> => {
    try {
      toast.loading("서버에 일정 생성 요청 중...");
      
      const serverResponse = await generateSchedule(payload);
      
      if (!serverResponse || !isNewServerScheduleResponse(serverResponse)) {
        toast.error("서버에서 일정을 받아오지 못했거나, 응답 형식이 올바르지 않습니다.");
        console.warn("[useItineraryActions] Invalid server response type:", serverResponse);
        return null;
      }
      
      // originalSelectedPlaces를 formatServerItinerary에 전달
      const formattedItinerary = formatServerItinerary(serverResponse, tripStartDate, originalSelectedPlaces);
      
      if (formattedItinerary.length === 0) {
        toast.error("서버에서 유효한 일정을 구성하지 못했습니다.");
        return null;
      }
      
      console.log("[useItineraryActions] 서버로부터 일정 수신 및 포맷 완료:", {
        일수: formattedItinerary.length,
      });
      
      setItinerary(formattedItinerary);
      if (formattedItinerary.length > 0) {
        setSelectedItineraryDay(formattedItinerary[0].day as number);
      }
      
      toast.success(`${formattedItinerary.length}일 일정이 생성되었습니다!`);
      return formattedItinerary;
    } catch (error) {
      console.error("[useItineraryActions] 서버 일정 생성 오류:", error);
      toast.error("서버에서 일정을 생성하는데 실패했습니다.");
      return null;
    }
  };

  // Main handler exposed to components
  const handleCreateItinerary = async (
    selectedPlaces: Place[], 
    dates: {
      startDate: Date;
      endDate: Date;
      startTime: string;
      endTime: string;
    } | null,
    payload?: SchedulePayload
  ): Promise<ItineraryDay[] | null> => {
    if (!dates) {
      console.error('[useItineraryActions] 경로 생성 실패: 날짜 정보가 없습니다.');
      toast.error("여행 날짜를 설정해주세요!");
      return null;
    }
    
    if (selectedPlaces.length === 0) {
      console.error('[useItineraryActions] 경로 생성 실패: 선택된 장소가 없습니다.');
      toast.error("장소를 먼저 선택해주세요!");
      return null;
    }
    
    console.log("[useItineraryActions] 경로 생성 시작:", {
      장소수: selectedPlaces.length,
      날짜: dates,
      페이로드유무: !!payload
    });
    
    let result: ItineraryDay[] | null = null;

    if (payload && dates.startDate) {
      console.log("[useItineraryActions] 서버 API를 통한 일정 생성 시도");
      // createServerItinerary 호출 시 selectedPlaces 전달
      result = await createServerItinerary(payload, dates.startDate, selectedPlaces);
       if (result) {
         setShowItinerary(true);
       }
       return result;
    }
    
    console.log("[useItineraryActions] 로컬 알고리즘을 통한 일정 생성");
    result = generateLocalItinerary(
      selectedPlaces,
      dates.startDate,
      dates.endDate,
      dates.startTime,
      dates.endTime
    );
    
    // generateLocalItinerary 내부에서 setShowItinerary 및 toast 처리하므로 중복 제거
    // if (result) {
    //   toast.success("일정이 성공적으로 생성되었습니다!"); 
    //   setShowItinerary(true);
    // }
    
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
