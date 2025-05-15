
import { usePlaceSelection } from './places/use-place-selection';
import { useAccommodationLimit } from './places/use-accommodation-limit';
import { useSchedulePayload } from './places/use-schedule-payload'; 
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase'; 
import { CategoryName } from '@/utils/categoryUtils';

/**
 * Hook that manages selected places, auto-completion, and schedule preparation
 */
export const useSelectedPlaces = () => {
  const {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    setCandidatePlaces
  } = usePlaceSelection();

  const { isAccommodationLimitReached } = useAccommodationLimit();
  const { prepareSchedulePayload } = useSchedulePayload();

  return {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    isAccommodationLimitReached
  };
};
