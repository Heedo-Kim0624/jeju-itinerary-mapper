
import { useCallback } from 'react';
import { useScheduleParser } from './useScheduleParser';
import type { ItineraryDay, SelectedPlace, NewServerScheduleResponse } from '@/types/core';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface UseScheduleGenerationCoreProps {
  selectedPlaces: SelectedPlace[];
  startDate: Date; // Used by parseScheduleResponse
  geoJsonNodes: any[]; // Potentially for future use or more detailed parsing
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setServerRoutes?: (routes: Record<number, ServerRouteDataForDay>) => void; // Optional, for route data
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationCore = ({
  selectedPlaces,
  startDate,
  // geoJsonNodes, // Not directly used in processServerResponse currently
  setItinerary,
  setSelectedDay,
  // setServerRoutes, // Not directly used in processServerResponse currently
  setIsLoadingState,
}: UseScheduleGenerationCoreProps) => {
  const { parseScheduleResponse } = useScheduleParser();

  const processServerResponse = useCallback(
    async (serverResponse: NewServerScheduleResponse, responseStartDate: Date): Promise<ItineraryDay[]> => {
      console.log("[useScheduleGenerationCore] Processing server response:", serverResponse);
      setIsLoadingState(true);

      try {
        const parsedItinerary = parseScheduleResponse(
          serverResponse,
          responseStartDate, // Use the startDate passed to this function
          selectedPlaces 
        );

        console.log("[useScheduleGenerationCore] Parsed itinerary:", parsedItinerary);

        if (parsedItinerary && parsedItinerary.length > 0) {
          setItinerary(parsedItinerary);
          // Auto-select the first day of the new itinerary
          // setSelectedDay(parsedItinerary[0].day); // This is handled by useScheduleStateAndEffects now
          console.log("[useScheduleGenerationCore] Itinerary set, first day should be auto-selected by effect.");
        } else {
          setItinerary([]);
          setSelectedDay(null);
          console.warn("[useScheduleGenerationCore] No itinerary data parsed or empty itinerary.");
        }
        setIsLoadingState(false);
        return parsedItinerary; // Return the parsed itinerary
      } catch (error) {
        console.error("[useScheduleGenerationCore] Error processing server response:", error);
        setItinerary([]);
        setSelectedDay(null);
        setIsLoadingState(false);
        // throw error; // Re-throw if caller needs to handle it, or return empty array
        return []; // Return empty array on error to satisfy signature
      }
    },
    [
      setIsLoadingState,
      parseScheduleResponse,
      selectedPlaces,
      // startDate, // startDate from props is for general context, responseStartDate is for this specific call
      setItinerary,
      setSelectedDay,
    ]
  );

  return {
    processServerResponse,
  };
};
