
import { useState } from 'react';
import { Place, SchedulePayload, ItineraryDay } from '@/types/core';
import { useItineraryCreator } from '../use-itinerary-creator';
import { useScheduleGenerator } from '../use-schedule-generator'; // 서버 스케줄 생성용
import { toast } from 'sonner';
import { NewServerScheduleResponse, isNewServerScheduleResponse } from '@/types/schedule';
import { formatServerItinerary } from './itinerary-logic/formatServerItinerary';
import { getDateStringMMDD, getDayOfWeekString } from '@/hooks/itinerary/itineraryUtils';

// Import ReturnType for hooks if specific return types are not exported
import { useTripDetails } from '@/hooks/use-trip-details';
import { useSelectedPlaces } from '@/hooks/use-selected-places';

// Define interfaces for hook return types if not available for import
// For simplicity, using ReturnType now.
// interface UseTripDetailsReturn { /* replace with actual structure */ } 
// interface UseSelectedPlacesReturn { /* replace with actual structure */ }

export interface UseItineraryActionsProps {
  tripDetails: ReturnType<typeof useTripDetails>;
  selectedPlacesHook: ReturnType<typeof useSelectedPlaces>;
}

export const useItineraryActions = (props?: UseItineraryActionsProps) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  // useItineraryCreator does not take arguments in its hook definition
  const { createItinerary: clientSideCreateItinerary } = useItineraryCreator(); 
  const { generateSchedule: serverSideGenerateSchedule, isGenerating } = useScheduleGenerator();

  const handleSelectItineraryDay = (day: number) => {
    console.log('일정 일자 선택:', day);
    setSelectedItineraryDay(day);
  };

  // Client-side itinerary generation (local algorithm)
  const generateLocalItinerary = (
    placesToUse: Place[], // Expects Place with string id
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
      
      const generatedItineraryFromCreator = clientSideCreateItinerary(
        placesToUse, // Pass Place[]
        startDate,
        endDate,
        startTime,
        endTime
      );
      
      if (generatedItineraryFromCreator.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return null;
      }
      
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

  // Server-side itinerary generation
  const createServerItinerary = async (
    payload: SchedulePayload, // Contains SchedulePlace with id: string | number
    tripStartDate: Date,
    originalSelectedPlaces: Place[] // Place with id: string
  ): Promise<ItineraryDay[] | null> => {
    try {
      toast.loading("서버에 일정 생성 요청 중...");
      
      const serverResponse = await serverSideGenerateSchedule(payload);
      
      if (!serverResponse || !isNewServerScheduleResponse(serverResponse)) {
        toast.error("서버에서 일정을 받아오지 못했거나, 응답 형식이 올바르지 않습니다.");
        console.warn("[useItineraryActions] Invalid server response type:", serverResponse);
        return null;
      }
      
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
  
  const handleServerItineraryResponse = (
    response: NewServerScheduleResponse, 
    tripStartDate: Date,
    originalSelectedPlaces: Place[] // Pass original places for formatting context
  ) => {
    console.log("[useItineraryActions] 서버 응답 직접 처리 시작:", response);
    const formatted = formatServerItinerary(response, tripStartDate, originalSelectedPlaces);
    if (formatted && formatted.length > 0) {
      setItinerary(formatted);
      setSelectedItineraryDay(formatted[0].day);
      setShowItinerary(true); // 중요: 서버 응답 후 UI 표시
      toast.success("서버로부터 일정을 성공적으로 받았습니다!");
    } else {
      toast.error("서버 응답을 처리했지만 유효한 일정을 만들 수 없습니다.");
    }
  };


  // Main handler exposed to components
  // This function determines whether to use local or server generation
  // Or simply triggers one based on context, decided by the caller.
  // For now, it's simplified: caller provides all necessary data.
  const generateItinerary = async (
    placesForPath: Place[], // These should be Place[] with string IDs
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string,
    // Optional payload for server-side generation
    // If payload is provided, server-side generation is attempted.
    payload?: SchedulePayload 
  ): Promise<ItineraryDay[] | null> => {
    
    if (payload && startDate) { // Server-side generation preferred if payload exists
      console.log("[useItineraryActions] 서버 API를 통한 일정 생성 시도");
      // originalSelectedPlaces (Place[]) is `placesForPath` here.
      const serverResult = await createServerItinerary(payload, startDate, placesForPath); 
      if (serverResult) {
        setShowItinerary(true); // Ensure UI updates
      }
      return serverResult;
    }
    
    // Fallback to local generation
    console.log("[useItineraryActions] 로컬 알고리즘을 통한 일정 생성");
    return generateLocalItinerary(
      placesForPath,
      startDate,
      endDate,
      startTime,
      endTime
    );
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary, // Make sure this is returned
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary, // Unified generation function
    handleServerItineraryResponse, // Expose this to handle externally fetched server responses
    isGenerating // from useScheduleGenerator
  };
};

// Export the return type for use in other hooks
export type UseItineraryActionsReturn = ReturnType<typeof useItineraryActions>;

