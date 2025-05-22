
import { useCallback } from 'react';
import { SelectedPlace, ItineraryDay, NewServerScheduleResponse, SchedulePayload } from '@/types/core';
import { parseSingleRouteSummary } from './parser-utils/routeSummaryParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
  lastPayload: SchedulePayload | null; // Add lastPayload here
}

export const useScheduleParser = ({ currentSelectedPlaces, lastPayload }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ItineraryDay[] => {
    console.log('[useScheduleParser] Processing server response:', response);
    if (!response || !response.schedule || !response.route_summary) {
      console.error('[useScheduleParser] Invalid server response structure received:', response);
      return [];
    }
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const { schedule: allScheduleItems, route_summary } = response;
    
    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    // Sort route_summary by day key to ensure chronological order if server doesn't guarantee it.
    // This is tricky if day keys are mixed ("Mon", "Day2").
    // Assuming server sends route_summary in chronological order.
    
    const itineraryDays: ItineraryDay[] = route_summary.map(
      (summaryItem, index) => parseSingleRouteSummary(
        summaryItem,
        index, // pass the index as dayIndex
        allScheduleItems,
        tripStartDate,
        currentSelectedPlaces,
        dayOfWeekMap,
        lastPayload // Pass lastPayload
      )
    );

    itineraryDays.sort((a, b) => a.day - b.day);
    
    console.log('[useScheduleParser] Processed itinerary days:', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;
  }, [currentSelectedPlaces, lastPayload]); // Add lastPayload to dependencies

  return { parseServerResponse };
};
