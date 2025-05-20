
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';
import { useEffect, useCallback } from 'react';
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

  // 최종 로딩 상태 계산
  const combinedIsLoading = isGeneratingFromGenerator || isLoadingStateFromEffects;

  // 서버 응답 이벤트 핸들러
  const handleRawServerResponse = useCallback(() => {
    console.log("[useScheduleManagement] rawServerResponseReceived 이벤트 감지됨. 로딩 상태:", isLoadingStateFromEffects);
    
    if (isLoadingStateFromEffects) {
      // 서버 응답을 받은 후 로딩 상태를 해제하여 무한 로딩 방지
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

  // 상태 변화 및 이벤트 로깅
  useEffect(() => {
    console.log(`[useScheduleManagement] State Update:
      - isGenerating: ${isGeneratingFromGenerator}
      - isLoadingState: ${isLoadingStateFromEffects}
      - Combined isLoading: ${combinedIsLoading}
      - Itinerary length: ${itinerary.length}
      - Selected Day: ${selectedDay}`);
      
    // 서버 응답 이벤트 리스너 등록
    window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
    
    return () => {
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
    };
  }, [
    isGeneratingFromGenerator, 
    isLoadingStateFromEffects, 
    combinedIsLoading, 
    itinerary, 
    selectedDay, 
    handleRawServerResponse
  ]);

  // 안전 장치: 로딩 상태가 너무 오래 지속되면 강제로 해제
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (combinedIsLoading) {
      timeoutId = window.setTimeout(() => {
        console.log("[useScheduleManagement] 로딩 타임아웃 도달, 로딩 상태 강제 해제");
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
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
