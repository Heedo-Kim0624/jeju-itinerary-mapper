
import { useState, useCallback } from 'react';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/types/itinerary';

export interface UseItineraryCreatorProps {
  // Add any props that the hook needs
}

export interface UseItineraryCreatorReturn {
  itinerary: ItineraryDay[] | null;
  isCreating: boolean;
  error: Error | null;
  setItinerary: (itinerary: ItineraryDay[] | null) => void;
  createItinerary: (places: Place[], days: number, startTime?: string, endTime?: string) => Promise<ItineraryDay[] | null>;
}

export const useItineraryCreator = (): UseItineraryCreatorReturn => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Define createItinerary function to generate an itinerary from a list of places
  const createItinerary = useCallback(
    async (places: Place[], days: number, startTime = "09:00", endTime = "21:00"): Promise<ItineraryDay[] | null> => {
      if (places.length === 0 || days <= 0) {
        console.error("Invalid input for createItinerary: places must not be empty and days must be positive");
        return null;
      }

      try {
        setIsCreating(true);
        setError(null);

        // Default implementation logic - in a real app, this might call an API
        const placesPerDay = Math.ceil(places.length / days);
        const generatedItinerary: ItineraryDay[] = [];

        for (let day = 1; day <= days; day++) {
          const startIndex = (day - 1) * placesPerDay;
          const endIndex = Math.min(startIndex + placesPerDay, places.length);
          const dayPlaces = places.slice(startIndex, endIndex);

          generatedItinerary.push({
            day,
            places: dayPlaces,
            totalDistance: 0, // This should be calculated based on routes
            startTime,
            endTime
          });
        }

        // Set the generated itinerary
        setItinerary(generatedItinerary);
        return generatedItinerary;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create itinerary');
        setError(error);
        console.error("Error creating itinerary:", error);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  return {
    itinerary,
    isCreating,
    error,
    setItinerary,
    createItinerary
  };
};

// Re-export ItineraryDay type for convenience and backwards compatibility
export type { ItineraryDay } from '@/types/itinerary';
