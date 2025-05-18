
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';
import { useEffect, useState, useRef } from 'react'; // useState, useRef 추가

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
  
  // 명시적인 렌더링 트리거를 위한 카운터 상태 추가
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // 이전 로딩 상태를 추적하기 위한 ref
  const prevLoadingState = useRef({ 
    isGenerating: true, 
    isLoadingState: true,
    combined: true
  });

  const { runScheduleGenerationProcess } = useScheduleGenerationRunner({
    selectedPlaces,
    dates,
    startDatetime,
    endDatetime,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
  });

  const combinedIsLoading = isGeneratingFromGenerator || isLoadingStateFromEffects;

  // 로딩 상태가 변경될 때 트리거 업데이트
  useEffect(() => {
    const currentState = {
      isGenerating: isGeneratingFromGenerator,
      isLoadingState: isLoadingStateFromEffects,
      combined: combinedIsLoading
    };
    
    // 로딩 상태가 true에서 false로 변경될 때만 렌더 트리거 증가
    if ((prevLoadingState.current.combined && !currentState.combined) ||
        (prevLoadingState.current.isGenerating && !currentState.isGenerating) ||
        (prevLoadingState.current.isLoadingState && !currentState.isLoadingState)) {
      console.log(`[useScheduleManagement] 로딩 상태 변경 감지! 렌더 트리거 증가:`, {
        이전: prevLoadingState.current,
        현재: currentState,
        렌더트리거: renderTrigger + 1
      });
      setRenderTrigger(prev => prev + 1);
    }
    
    // 이전 상태 업데이트
    prevLoadingState.current = currentState;
    
    console.log(`[useScheduleManagement] 로딩 상태 변화:
      - isGenerating (from use-schedule-generator): ${isGeneratingFromGenerator}
      - isLoadingState (from useScheduleStateAndEffects): ${isLoadingStateFromEffects}
      - Combined isLoading for UI: ${combinedIsLoading}
      - Itinerary length: ${itinerary.length}
      - Selected Day: ${selectedDay}
      - Render Trigger: ${renderTrigger}`);
      
  }, [isGeneratingFromGenerator, isLoadingStateFromEffects, combinedIsLoading, itinerary, selectedDay, renderTrigger]);

  // 일정이 생성되었을 때 이벤트 리스너
  useEffect(() => {
    const handleItineraryCreated = (event: CustomEvent) => {
      console.log("[useScheduleManagement] itineraryCreated 이벤트 수신", event.detail);
      // 만약 still loading 상태라면 강제로 loading 상태 해제
      if (combinedIsLoading && event.detail?.itinerary?.length > 0) {
        console.log("[useScheduleManagement] 이벤트 기반 강제 로딩 상태 해제");
        setIsLoadingState(false);
        // 렌더 트리거 증가
        setRenderTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated as EventListener);
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated as EventListener);
    };
  }, [combinedIsLoading, setIsLoadingState]);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
    renderTrigger, // 추가: 렌더 트리거 값 내보내기
  };
};
