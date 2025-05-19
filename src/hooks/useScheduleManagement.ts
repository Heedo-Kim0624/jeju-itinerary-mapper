
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';
import { useEffect, useCallback } from 'react'; // Add useCallback
import { ItineraryDay } from '@/types/core'; // 명시적으로 core에서 타입 import
import { toast } from 'sonner'; // Add toast for better user feedback

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
    setItinerary: (itinerary: ItineraryDay[]) => {
      console.log("[useScheduleManagement] Setting itinerary from runner:", 
        { length: itinerary.length, firstDay: itinerary[0]?.day });
      setItinerary(itinerary);
      
      // Auto-select the first day when itinerary is set
      if (itinerary.length > 0 && !selectedDay) {
        setSelectedDay(itinerary[0].day);
      }
    },
    setSelectedDay,
    setIsLoadingState,
  });

  const combinedIsLoading = isGeneratingFromGenerator || isLoadingStateFromEffects;

  // Improved handler function as a useCallback to prevent unnecessary recreations
  const handleRawServerResponse = useCallback(() => {
    console.log("[useScheduleManagement] rawServerResponseReceived 이벤트 감지됨. 로딩 상태:", isLoadingStateFromEffects);
    
    if (isLoadingStateFromEffects) {
      // 서버 응답을 받은 후 로딩 상태를 해제하여 무한 로딩 방지
      // 약간의 지연을 두어 UI가 적절히 업데이트되도록 함
      setTimeout(() => {
        console.log("[useScheduleManagement] 서버 응답 후 로딩 상태 해제");
        setIsLoadingState(false);
        
        // 일정이 없는 경우 사용자에게 피드백 제공
        if (!itinerary || itinerary.length === 0) {
          toast.warning("서버에서 일정을 받았으나 비어있습니다. 다시 시도해주세요.");
        }
      }, 300);
    }
  }, [isLoadingStateFromEffects, setIsLoadingState, itinerary]);

  // Log all relevant states whenever they change and add server response handler
  useEffect(() => {
    console.log(`[useScheduleManagement] State Update:
      - isGenerating (from use-schedule-generator): ${isGeneratingFromGenerator}
      - isLoadingState (from useScheduleStateAndEffects): ${isLoadingStateFromEffects}
      - Combined isLoading for UI: ${combinedIsLoading}
      - Itinerary length: ${itinerary.length}
      - Selected Day: ${selectedDay}`);
      
    // 서버 응답을 감지하는 이벤트 리스너 추가
    window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
    
    return () => {
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
    };
  }, [isGeneratingFromGenerator, isLoadingStateFromEffects, combinedIsLoading, itinerary, selectedDay, handleRawServerResponse]);

  // Add safety mechanism: if loading state persists too long, force-clear it
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (combinedIsLoading) {
      // If loading state persists for more than 15 seconds, force clear it
      timeoutId = window.setTimeout(() => {
        console.log("[useScheduleManagement] Loading timeout reached, forcing loading state clear");
        setIsLoadingState(false);
        toast.error("일정 생성 시간이 너무 오래 걸립니다. 다시 시도해주세요.");
      }, 15000);
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
    isLoading: combinedIsLoading, // UI에 전달되는 최종 로딩 상태
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
