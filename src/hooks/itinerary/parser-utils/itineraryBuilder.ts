
import { ItineraryDay, NewServerScheduleResponse, ServerScheduleItem } from '@/types/core';
import { formatDate } from './timeUtils';
import { buildGroupedItineraryPlaces } from './groupedPlacesProcessor';
import { processRouteData } from './routeSummaryProcessor';
import { organizeAndSortScheduleByDay } from './scheduleOrganizer';
import { organizeRouteByDay } from './routeOrganizer';
import type { DetailedPlace } from '@/types/detailedPlace';
import type { PlaceData } from '@/hooks/data/useSupabaseDataFetcher'; // Added for callback type

/**
 * Main function to build itinerary days from server response
 */
export const buildItineraryDays = (
  serverResponse: NewServerScheduleResponse,
  tripStartDate: Date | null = null,
  dayMapping: Record<string, number>,
  // Added callback function as a parameter
  getPlaceDetailsByIdCallback: (id: number) => DetailedPlace | PlaceData | undefined
): ItineraryDay[] => {
  // Organize schedule and route data using new utilities
  const scheduleByDay = organizeAndSortScheduleByDay(serverResponse.schedule);
  const routeByDay = organizeRouteByDay(serverResponse.route_summary);

  // Build itinerary for each day
  const sortedDayKeys = [...scheduleByDay.keys()].sort();

  const result = sortedDayKeys.map((dayOfWeekKey) => {
    const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
    const routeInfo = routeByDay.get(dayOfWeekKey); // This can be undefined if no route for the day
    const dayNumber = dayMapping[dayOfWeekKey];

    // Parameters to buildGroupedItineraryPlaces updated
    // Pass the callback function here
    const groupedPlaces = buildGroupedItineraryPlaces(
      dayItemsOriginal,
      getPlaceDetailsByIdCallback, 
      dayNumber
    );

    // Process route data using the routeSummaryProcessor utility
    // processRouteData can handle undefined routeInfo gracefully
    const { nodeIds, linkIds, interleaved_route, totalDistance, segmentRoutes } = processRouteData(routeInfo);

    return {
      day: dayNumber,
      dayOfWeek: dayOfWeekKey,
      date: formatDate(tripStartDate, dayNumber - 1),
      places: groupedPlaces,
      totalDistance: totalDistance,
      routeData: {
        nodeIds: nodeIds,
        linkIds: linkIds,
        segmentRoutes: segmentRoutes
      },
      interleaved_route: interleaved_route
    };
  });

  return result;
};

