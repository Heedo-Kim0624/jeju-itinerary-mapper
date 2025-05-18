
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';
import { SelectedPlace } from '@/types/supabase';

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetimeISO: string | null;
  endDatetimeISO: string | null;
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetimeISO,
  endDatetimeISO,
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

  const { isGenerating: isServerGenerating } = useScheduleGeneratorHook();

  const { runScheduleGenerationProcess } = useScheduleGenerationRunner({
    selectedPlaces,
    dates,
    startDatetimeISO,
    endDatetimeISO,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
  });

  return {
    itinerary,
    selectedDay,
    isLoading: isLoadingState || isServerGenerating,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
