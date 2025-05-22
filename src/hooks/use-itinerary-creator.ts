
import { useCallback } from 'react';
import { useItineraryCreatorCore } from './itinerary-creator/useItineraryCreatorCore';
import type { Place, ItineraryDay } from '@/types/core';

export const useItineraryCreator = () => {
  const { createItinerary } = useItineraryCreatorCore();

  const createItineraryFromPlaces = useCallback((
    places: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => {
    return createItinerary(places, startDate, endDate, startTime, endTime);
  }, [createItinerary]);

  return { createItineraryFromPlaces };
};
