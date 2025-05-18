
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';

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
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { isGenerating } = useScheduleGeneratorHook();

  const { runScheduleGenerationProcess } = useScheduleGenerationRunner({
    selectedPlaces,
    dates,
    startDatetime,
    endDatetime,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
  });

  // isLoading 상태를 명확히 정의: 서버 요청 중이거나 내부 로딩 상태일 때
  const isLoading = isGenerating || isLoadingState;

  console.log("[useScheduleManagement] 상태 업데이트:", { 
    itinerary: itinerary.length > 0 ? `${itinerary.length}일 일정` : "없음", 
    selectedDay, 
    isLoadingState, 
    isGenerating, 
    isLoading 
  });

  return {
    itinerary,
    selectedDay,
    isLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
