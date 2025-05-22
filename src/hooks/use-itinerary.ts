
import { useMemo } from 'react';
import { useItineraryActions, UseItineraryActionsReturn } from './left-panel/use-itinerary-actions';
import { useTripDetails } from './use-trip-details';
import { useSelectedPlaces } from './use-selected-places';
import type { Place } from '@/types/core'; // ItineraryDay, SchedulePayload are handled by useItineraryActions

/**
 * `useItineraryActions`를 사용하여 일정 관련 상태와 로직을 통합적으로 관리하는 훅.
 * 이 훅은 `useItineraryActions`의 모든 반환 값을 그대로 노출하며,
 * 추가적으로 `isItineraryCreated`와 같은 파생 상태를 제공할 수 있습니다.
 */
export const useItinerary = () => {
  // Props for useItineraryActions if needed
  // const tripDetails = useTripDetails();
  // const selectedPlacesHook = useSelectedPlaces();
  // const itineraryActions = useItineraryActions({ tripDetails, selectedPlacesHook });
  
  // If useItineraryActions does not require props or manages its deps internally:
  const itineraryActions = useItineraryActions();

  const isItineraryCreated = useMemo(() => {
    return !!itineraryActions.itinerary && itineraryActions.itinerary.length > 0;
  }, [itineraryActions.itinerary]);

  // Expose all actions and state from useItineraryActions, plus any derived state.
  return {
    ...itineraryActions,
    isItineraryCreated,
    // generateItinerary is already part of itineraryActions
  };
};

// Export the return type of useItinerary for other consuming hooks
export type UseItineraryReturn = ReturnType<typeof useItinerary>;

