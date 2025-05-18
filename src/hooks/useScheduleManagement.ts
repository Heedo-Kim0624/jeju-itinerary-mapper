
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';
import { useEffect, useState, useCallback } from 'react';
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

  const { isGenerating: isGeneratingFromGenerator, generateSchedule } = useScheduleGeneratorHook();
  
  // 명시적인 렌더 트리거 상태 추가
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // 로딩 상태가 변경될 때마다 명시적으로 렌더링 트리거
  useEffect(() => {
    console.log(`[useScheduleManagement] Loading state changed:
      - isGeneratingFromGenerator: ${isGeneratingFromGenerator}
      - isLoadingStateFromEffects: ${isLoadingStateFromEffects}
      - Combined isLoading for UI: ${isGeneratingFromGenerator || isLoadingStateFromEffects}`);
  }, [isGeneratingFromGenerator, isLoadingStateFromEffects]);

  // 최종 로딩 상태 계산 (memo가 아닌 즉시 계산으로 항상 최신값 보장)
  const combinedIsLoading = isGeneratingFromGenerator || isLoadingStateFromEffects;

  // 로딩 상태 변경 시 강제 렌더링 트리거
  useEffect(() => {
    console.log(`[useScheduleManagement] Force rendering after loading state change: ${combinedIsLoading}`);
    setRenderTrigger(prev => prev + 1);
  }, [combinedIsLoading]);

  // 일정 데이터 변경 감지 및 자동 렌더링 트리거
  useEffect(() => {
    if (itinerary.length > 0) {
      console.log(`[useScheduleManagement] Itinerary received (${itinerary.length} days), triggering render`);
      setRenderTrigger(prev => prev + 1);
    }
  }, [itinerary]);

  // 일정 생성 요청 프로세스 최적화
  const { runScheduleGenerationProcess: originalRunProcess } = useScheduleGenerationRunner({
    selectedPlaces,
    dates,
    startDatetime,
    endDatetime,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
  });

  // runScheduleGenerationProcess 래퍼 함수 - 보다 명시적인 로딩 상태 관리
  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleManagement] 일정 생성 프로세스 시작 (명시적 로딩 상태 관리)");
    setIsLoadingState(true); // 명시적 로딩 시작
    
    try {
      // 원래 함수 호출
      await originalRunProcess();
      
      // 안전 장치: 5초 후 강제로 로딩 상태 해제 (서버 응답 후에도 UI가 갱신되지 않는 경우 대비)
      setTimeout(() => {
        if (isLoadingStateFromEffects) {
          console.log("[useScheduleManagement] 안전장치: 5초 후 로딩 상태 강제 해제");
          setIsLoadingState(false);
          setRenderTrigger(prev => prev + 1); // 강제 렌더링 트리거
          toast.info("일정 로딩 제한시간 초과, 화면을 갱신합니다");
        }
      }, 5000);
      
      return true;
    } catch (error) {
      console.error("[useScheduleManagement] 일정 생성 중 오류 발생:", error);
      toast.error("일정 생성 중 오류가 발생했습니다");
      setIsLoadingState(false); // 오류 발생 시 로딩 상태 해제
      return false;
    }
  }, [originalRunProcess, setIsLoadingState, isLoadingStateFromEffects]);

  // 디버깅용 로그
  console.log(`[useScheduleManagement] Render with state:
    - renderTrigger: ${renderTrigger}
    - isGenerating: ${isGeneratingFromGenerator}
    - isLoadingState: ${isLoadingStateFromEffects}
    - Combined isLoading: ${combinedIsLoading}
    - Itinerary length: ${itinerary.length}
    - Selected Day: ${selectedDay}`);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
    renderTrigger, // 명시적 렌더 트리거 추가 (사용처에서 강제 리렌더링에 활용)
  };
};
