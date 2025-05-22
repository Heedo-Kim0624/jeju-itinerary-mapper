import { useCallback } from 'react';
import { useItineraryCreator } from '@/hooks/use-itinerary-creator';
import type { Place, SelectedPlace, ItineraryDay } from '@/types/core'; // ItineraryDay from core

interface FallbackGeneratorOptions {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
}

export const useFallbackItineraryGenerator = () => {
  const { createItineraryFromPlaces } = useItineraryCreator(); // Use the correct destructured name

  const generateFallbackItinerary = useCallback(
    (places: (Place | SelectedPlace)[], options: FallbackGeneratorOptions): ItineraryDay[] | null => {
      const { startDate, endDate, startTime, endTime } = options;
      if (!startDate || !endDate || !startTime || !endTime) {
        console.error('[FallbackGenerator] Missing date/time for fallback itinerary.');
        return null;
      }
      
      const corePlaces: Place[] = places.map(p => ({
        ...p,
        id: String(p.id), // Ensure ID is string
        category: p.category || '기타', // Provide default category if missing
      }));

      try {
        return createItineraryFromPlaces(corePlaces, startDate, endDate, startTime, endTime); // Use the correct function name
      } catch (error) {
        console.error('[FallbackGenerator] Error generating fallback itinerary:', error);
        return null;
      }
    },
    [createItineraryFromPlaces]
  );

  return { generateFallbackItinerary };
};
