import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import type { SelectedPlace, ItineraryDay, SchedulePayload } from '@/types/core'; // Updated SelectedPlace import
import { useEffect, useCallback } from 'react'; 
import { toast } from 'sonner';
import { useSchedulePayloadBuilder } from '@/hooks/places/use-schedule-payload-builder'; // Import payload builder

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null;
  endDatetime: string | null;
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetime,
  endDatetime,
}: UseScheduleManagementProps) => {
  const {
    itinerary,
    setItinerary, // Keep setItinerary if it's used internally for state updates
    selectedDay,
    setSelectedDay, // Keep setSelectedDay for internal state updates
    isLoadingState: isLoadingStateFromEffects,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { isGenerating: isGeneratingFromGenerator, runScheduleGeneration } = useScheduleGenerationRunner();
  const { prepareSchedulePayload } = useSchedulePayloadBuilder(); // Get the payload builder function

  const runScheduleGenerationProcess = useCallback(async () => {
    if (!dates?.startDate || !dates?.endDate || !startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }

    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다.");
      return;
    }

    setIsLoadingState(true);
    console.log("[useScheduleManagement] 일정 생성 시작:", {
      장소수: selectedPlaces.length,
      시작일: dates.startDate,
      종료일: dates.endDate
    });

    try {
      // Use the centralized payload builder
      // Assuming all `selectedPlaces` are user-selected for now, and no separate candidate places from this hook's context.
      const payload = prepareSchedulePayload(selectedPlaces, [], startDatetime, endDatetime);

      if (!payload) {
        toast.error("일정 생성에 필요한 정보를 준비하지 못했습니다.");
        setIsLoadingState(false);
        return;
      }

      const result = await runScheduleGeneration(payload, selectedPlaces, dates.startDate);
      
      if (!result || result.length === 0) {
        // The toast for empty/failed generation is handled by useScheduleGenerationRunner or handleServerItineraryResponse
        // No need to duplicate it here unless specific context is needed.
        // toast.error("일정 생성에 실패했습니다. 다시 시도해주세요."); 
        // setItinerary([]); // This should be handled by the runner/response handler setting the itinerary
      } else {
        console.log("[useScheduleManagement] 일정 생성 성공:", result.length, "일 일정");
        // setItinerary(result); // This is also handled by handleServerItineraryResponse flow via runner
        // if (result.length > 0 && result[0]?.day) {
        //   setSelectedDay(result[0].day);
        // }
      }
      
    } catch (error) {
      console.error("[useScheduleManagement] 일정 생성 중 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      // setItinerary([]); // Also handled by runner's error path
    } finally {
      setIsLoadingState(false); // Ensure loading state is always reset
    }
  }, [selectedPlaces, dates, startDatetime, endDatetime, setIsLoadingState, runScheduleGeneration, prepareSchedulePayload /*, setItinerary, setSelectedDay*/]);

  const combinedIsLoading = isGeneratingFromGenerator || isLoadingStateFromEffects;

  // handleRawServerResponse와 관련된 useEffect는 제거되었습니다.
  // 로딩 상태 해제는 useScheduleGenerationRunner 내부의 handleServerResponse 또는 fallback/error 로직에서 처리됩니다.
  // 빈 일정에 대한 토스트 메시지도 해당 위치에서 처리하는 것이 더 적절할 수 있습니다.

  useEffect(() => {
    // 이 useEffect는 상태 로깅 목적으로 유지합니다.
    console.log(`[useScheduleManagement] State Update:
      - isGenerating: ${isGeneratingFromGenerator}
      - isLoadingState: ${isLoadingStateFromEffects}
      - Combined isLoading: ${combinedIsLoading}
      - Itinerary length: ${itinerary.length}
      - Selected Day: ${selectedDay}`);
  }, [
    isGeneratingFromGenerator, 
    isLoadingStateFromEffects, 
    combinedIsLoading, 
    itinerary, 
    selectedDay
  ]);

  useEffect(() => {
    // 이 useEffect는 로딩 타임아웃 처리용으로 유지합니다.
    let timeoutId: number | null = null;
    
    if (combinedIsLoading) {
      timeoutId = window.setTimeout(() => {
        console.log("[useScheduleManagement] 로딩 타임아웃 도달, 로딩 상태 강제 해제");
        setIsLoadingState(false);
        // 타임아웃 시 빈 일정을 설정하거나 사용자에게 알림
        // setItinerary([]); // 필요하다면 빈 일정으로 초기화
        // setSelectedDay(null);
        toast.error("일정 생성 시간이 너무 오래 걸립니다. 다시 시도해주세요.");
      }, 15000); // 15초 타임아웃
    }
    
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [combinedIsLoading, setIsLoadingState]);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
