
import { useCallback } from 'react';
import { SelectedPlace, ItineraryDay, NewServerScheduleResponse } from '@/types/core';
// Removed ServerScheduleItem, ServerRouteSummaryItem, CategoryName, ItineraryPlaceWithTime as they are used in helpers
// Removed extractAllNodesFromRoute, extractAllLinksFromRoute, getDateStringMMDD, getDayOfWeekString as they are used in helpers
import { parseSingleRouteSummary } from './parser-utils/routeSummaryParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

// MapContextGeoNode, findCoordinatesFromMapContextNodes, updateItineraryWithCoordinates were moved to parser-utils
// createPlaceWithTimeFromSchedule was moved to parser-utils
// parseSingleRouteSummary is now imported

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
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

    const itineraryDays: ItineraryDay[] = route_summary.map(
      (summaryItem, index) => parseSingleRouteSummary(
        summaryItem,
        index,
        allScheduleItems,
        tripStartDate,
        currentSelectedPlaces,
        dayOfWeekMap
      )
    );

    // 일자순으로 정렬 (tripDayNumber 기준)
    itineraryDays.sort((a, b) => a.day - b.day);
    
    console.log('[useScheduleParser] Processed itinerary days (before coord update):', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
