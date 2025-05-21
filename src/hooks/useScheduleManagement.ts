import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';
import { useEffect, useCallback } from 'react'; 
import { ItineraryDay, SchedulePayload } from '@/types/core';
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

  const { isGenerating: isGeneratingFromGenerator, runScheduleGeneration } = useScheduleGenerationRunner();

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
      const payload: SchedulePayload = {
        selected_places: selectedPlaces.map(p => ({ id: p.id, name: p.name })),
        candidate_places: [], // 필요한 경우 후보 장소 추가
        start_datetime: startDatetime,
        end_datetime: endDatetime,
      };

      const result = await runScheduleGeneration(payload, selectedPlaces, dates.startDate);
      
      if (!result || result.length === 0) {
        toast.error("일정 생성에 실패했습니다. 다시 시도해주세요.");
        setIsLoadingState(false);
        return;
      }
      
      console.log("[useScheduleManagement] 일정 생성 성공:", result.length, "일 일정");
    } catch (error) {
      console.error("[useScheduleManagement] 일정 생성 중 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingState(false);
    }
  }, [selectedPlaces, dates, startDatetime, endDatetime, setIsLoadingState, runScheduleGeneration]);

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
