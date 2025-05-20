
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';
import { useEffect, useCallback } from 'react'; // useCallback is no longer used directly here for handleRawServerResponse
import { ItineraryDay } from '@/types/core';
import { toast } from 'sonner';

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
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState: isLoadingStateFromEffects,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { isGenerating: isGeneratingFromGenerator } = useScheduleGeneratorHook();

  const { runScheduleGenerationProcess } = useScheduleGenerationRunner({
    selectedPlaces,
    dates,
    startDatetime,
    endDatetime,
    setItinerary: (newItinerary: ItineraryDay[]) => {
      console.log("[useScheduleManagement] Setting itinerary from runner:", 
        { length: newItinerary.length, firstDay: newItinerary[0]?.day });
      setItinerary(newItinerary);
      
      // setSelectedDay는 이제 useScheduleGenerationCore 또는 useFallbackItineraryGenerator에서 처리될 수 있으므로,
      // 여기서의 중복 호출을 검토하거나, runner가 최종적으로 itinerary와 selectedDay를 결정하도록 합니다.
      // 현재 로직은 runner가 itinerary를 설정하면, 이 콜백에서 selectedDay를 설정합니다.
      // 만약 runner가 이미 selectedDay를 설정한다면, 이 부분이 중복될 수 있습니다.
      // 지금은 기존 로직을 유지하되, 추후 최적화 포인트로 남겨둡니다.
      if (newItinerary.length > 0 && !selectedDay) {
        setSelectedDay(newItinerary[0].day);
      } else if (newItinerary.length === 0) {
        // 일정이 비어있다면 selectedDay도 null로 설정
        setSelectedDay(null);
      }
    },
    setSelectedDay, // setSelectedDay를 runner에 직접 전달하여 runner가 관리하도록 할 수도 있습니다.
    setIsLoadingState,
  });

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
