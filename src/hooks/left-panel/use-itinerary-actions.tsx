import { useState } from 'react';
import { Place, SchedulePayload, ItineraryDay } from '@/types/core';
import { useItineraryCreator } from '../use-itinerary-creator';
import { useScheduleGenerator } from '../use-schedule-generator';
import { toast } from 'sonner';
import { NewServerScheduleResponse, isNewServerScheduleResponse } from '@/types/schedule';
import { formatClientItinerary } from './itinerary-logic/formatClientItinerary';
import { formatServerItinerary } from './itinerary-logic/formatServerItinerary';

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

      const finalGeneratedItinerary = formatClientItinerary(generatedItineraryFromCreator, startDate);
      
      setItinerary(finalGeneratedItinerary);
      setSelectedItineraryDay(1); // Always select the first day by default
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
  const createServerItinerary = async (payload: SchedulePayload, tripStartDate: Date): Promise<ItineraryDay[] | null> => {
    try {
      toast.loading("서버에 일정 생성 요청 중...");
      
      const serverResponse = await generateSchedule(payload);
      
      if (!serverResponse || !isNewServerScheduleResponse(serverResponse)) {
        toast.error("서버에서 일정을 받아오지 못했거나, 응답 형식이 올바르지 않습니다.");
        console.warn("[useItineraryActions] Invalid server response type:", serverResponse);
        return null;
      }
      
      const formattedItinerary = formatServerItinerary(serverResponse, tripStartDate);
      
      if (formattedItinerary.length === 0) {
        // formatServerItinerary internally logs warnings for empty/invalid data before returning empty array
        toast.error("서버에서 유효한 일정을 구성하지 못했습니다.");
        return null;
      }
      
      console.log("[useItineraryActions] 서버로부터 일정 수신 및 포맷 완료:", {
        일수: formattedItinerary.length,
      });
      
      setItinerary(formattedItinerary);
      if (formattedItinerary.length > 0) {
        setSelectedItineraryDay(formattedItinerary[0].day as number); // Select first day
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
  const handleCreateItinerary = async ( // Made async to align with createServerItinerary
    selectedPlaces: Place[], 
    dates: {
      startDate: Date;
      endDate: Date;
      startTime: string;
      endTime: string;
    } | null,
    payload?: SchedulePayload
  ): Promise<ItineraryDay[] | null> => { // Return type updated
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
      result = await createServerItinerary(payload, dates.startDate);
      // If server generation fails (result is null), it will implicitly fall through to local if desired,
      // or simply return null if no fallback is intended here.
      // Current logic: if payload exists, only try server. Fallback is not explicit here.
      // Let's keep this behavior: if payload is provided, it's server-only.
       if (result) {
         setShowItinerary(true);
       }
       return result; // Return server result (or null if failed)
    }
    
    // Fallback or primary local generation
    console.log("[useItineraryActions] 로컬 알고리즘을 통한 일정 생성");
    result = generateLocalItinerary(
      selectedPlaces,
      dates.startDate,
      dates.endDate,
      dates.startTime,
      dates.endTime
    );
    
    if (result) {
      toast.success("일정이 성공적으로 생성되었습니다!"); // This toast might be redundant if generateLocalItinerary also toasts
      setShowItinerary(true); // Already handled in generateLocalItinerary
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
    isGenerating // from useScheduleGenerator
  };
};
