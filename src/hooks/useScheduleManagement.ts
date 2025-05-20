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
    setItinerary: (newItinerary: ItineraryDay[]) => {
      console.log("[useScheduleManagement] Setting itinerary from runner:", 
        { length: newItinerary.length, firstDay: newItinerary[0]?.day });
      setItinerary(newItinerary);
      
      if (newItinerary.length > 0 && !selectedDay) {
        setSelectedDay(newItinerary[0].day);
      }
    },
    setSelectedDay,
    setIsLoadingState,
  });

  const combinedIsLoading = isGeneratingFromGenerator || isLoadingStateFromEffects;

  const handleRawServerResponse = useCallback(() => {
    console.log("[useScheduleManagement] rawServerResponseReceived 이벤트 감지됨. 로딩 상태:", isLoadingStateFromEffects);
    
    if (isLoadingStateFromEffects) {
      setTimeout(() => {
        console.log("[useScheduleManagement] 서버 응답 후 로딩 상태 해제");
        setIsLoadingState(false);
        
        if (!itinerary || itinerary.length === 0) {
          toast.warning("서버에서 일정을 받았으나 비어있습니다. 다시 시도해주세요.");
        }
      }, 300);
    }
  }, [isLoadingStateFromEffects, setIsLoadingState, itinerary]);

  useEffect(() => {
    console.log(`[useScheduleManagement] State Update:
      - isGenerating: ${isGeneratingFromGenerator}
      - isLoadingState: ${isLoadingStateFromEffects}
      - Combined isLoading: ${combinedIsLoading}
      - Itinerary length: ${itinerary.length}
      - Selected Day: ${selectedDay}`);
      
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
