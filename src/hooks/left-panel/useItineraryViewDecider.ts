
import { useMemo } from 'react';
import type { ItineraryDay } from '@/types';

interface ItineraryManagementState {
  showItinerary: boolean;
  isItineraryCreated?: boolean;
  itinerary: ItineraryDay[] | null;
}

interface UseItineraryViewDeciderArgs {
  itineraryManagement: ItineraryManagementState;
}

export const useItineraryViewDecider = ({
  itineraryManagement,
}: UseItineraryViewDeciderArgs) => {
  const shouldShowItineraryView = useMemo(() => {
    return (
      itineraryManagement.showItinerary &&
      !!itineraryManagement.isItineraryCreated && // Ensure isItineraryCreated is truthy
      itineraryManagement.itinerary &&
      itineraryManagement.itinerary.length > 0
    );
  }, [
    itineraryManagement.showItinerary,
    itineraryManagement.isItineraryCreated,
    itineraryManagement.itinerary,
  ]);

  return { shouldShowItineraryView };
};
