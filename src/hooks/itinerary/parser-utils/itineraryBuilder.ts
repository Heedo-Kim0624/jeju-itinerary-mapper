import { ItineraryDay, NewServerScheduleResponse, Place } from '@/types/core';
import { formatDate } from './timeUtils';
import { buildGroupedItineraryPlaces } from './groupedPlacesProcessor';
import { processRouteData } from './routeSummaryProcessor';
import { organizeAndSortScheduleByDay } from './scheduleOrganizer';
import { organizeRouteByDay } from './routeOrganizer';
import type { DetailedPlace } from '@/types/detailedPlace';

// Helper for chronological day sort based on common English/Korean day names
const dayOrderLookup: { [key: string]: number } = {
  'Mon': 1, '월': 1,
  'Tue': 2, '화': 2,
  'Wed': 3, '수': 3,
  'Thu': 4, '목': 4,
  'Fri': 5, '금': 5,
  'Sat': 6, '토': 6,
  'Sun': 7, '일': 7
};

/**
 * Main function to build itinerary days from server response
 */
export const buildItineraryDays = (
  serverResponse: NewServerScheduleResponse,
  tripStartDate: Date | null = null,
  dayMapping: Record<string, number>, // This dayMapping is based on chronologically sorted day keys
  getPlaceDetailsByIdCallback: (id: number) => DetailedPlace | undefined,
  allPlacesMapByName: Map<string, Place>
): ItineraryDay[] => {
  const scheduleByDay = organizeAndSortScheduleByDay(serverResponse.schedule);
  const routeByDay = organizeRouteByDay(serverResponse.route_summary);

  // Get day keys from scheduleByDay and sort them chronologically
  const dayKeysFromSchedule = Array.from(scheduleByDay.keys());
  const sortedChronologicalDayKeys = dayKeysFromSchedule.sort((a, b) => 
    (dayOrderLookup[a] || 99) - (dayOrderLookup[b] || 99)
  );

  // Build itinerary for each day using chronologically sorted keys
  const itineraryDaysUnsorted = sortedChronologicalDayKeys.map((dayOfWeekKey) => {
    const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
    const routeInfo = routeByDay.get(dayOfWeekKey);
    const dayNumber = dayMapping[dayOfWeekKey]; // dayMapping should be created based on these sorted keys

    // Parameters to buildGroupedItineraryPlaces updated
    // Pass the callback function here
    const groupedPlaces = buildGroupedItineraryPlaces(
      dayItemsOriginal,
      getPlaceDetailsByIdCallback, 
      dayNumber,
      allPlacesMapByName
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

  // Sort the final ItineraryDay array by the 'day' number to be absolutely sure
  const sortedItineraryDays = itineraryDaysUnsorted.sort((a, b) => a.day - b.day);

  return sortedItineraryDays;
};
