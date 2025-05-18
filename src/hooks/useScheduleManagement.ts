
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

  const isLoading = isGenerating || isLoadingState;

  console.log(`[useScheduleManagement] Loading State Update:
    - isGenerating (from use-schedule-generator): ${isGenerating}
    - isLoadingState (from useScheduleStateAndEffects): ${isLoadingState}
    - Combined isLoading for UI: ${isLoading}
    - Itinerary length: ${itinerary.length}`);

  return {
    itinerary,
    selectedDay,
    isLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
