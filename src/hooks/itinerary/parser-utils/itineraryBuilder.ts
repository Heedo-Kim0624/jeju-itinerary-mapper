
import { ItineraryDay, ServerScheduleItem, NewServerScheduleResponse, SelectedPlace, SchedulePayload } from '@/types/core';
import { formatDate } from './timeUtils';
import { buildGroupedItineraryPlaces } from './groupedPlacesProcessor';
import { processRouteData } from './routeSummaryProcessor';

/**
 * Main function to build itinerary days from server response
 */
export const buildItineraryDays = (
  serverResponse: NewServerScheduleResponse,
  currentSelectedPlaces: SelectedPlace[] = [],
  tripStartDate: Date | null = null,
  lastPayload: SchedulePayload | null = null,
  dayMapping: Record<string, number>
): ItineraryDay[] => {
  const scheduleByDay = new Map<string, ServerScheduleItem[]>();
  const routeByDay = new Map<string, any>();

  // Organize schedule items by day
  serverResponse.schedule.forEach(item => {
    const dayKey = item.time_block.split('_')[0];
    if (!scheduleByDay.has(dayKey)) {
      scheduleByDay.set(dayKey, []);
    }
    scheduleByDay.get(dayKey)?.push(item);
  });

  // Sort items within each day by time_block
  scheduleByDay.forEach((items, dayKey) => {
    items.sort((a, b) => a.time_block.localeCompare(b.time_block));
    scheduleByDay.set(dayKey, items);
  });

  // Organize route data by day
  serverResponse.route_summary.forEach(route => {
    routeByDay.set(route.day, route);
  });

  // Build itinerary for each day
  const sortedDayKeys = [...scheduleByDay.keys()].sort();

  const result = sortedDayKeys.map((dayOfWeekKey) => {
    const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
    const routeInfo = routeByDay.get(dayOfWeekKey);
    const dayNumber = dayMapping[dayOfWeekKey];

    const groupedPlaces = buildGroupedItineraryPlaces(
      dayItemsOriginal, lastPayload, currentSelectedPlaces, dayNumber
    );

    // Process route data using the new utility
    const { nodeIds, linkIds, interleaved_route, totalDistance, segmentRoutes } = processRouteData(routeInfo);

    return {
      day: dayNumber,
      dayOfWeek: dayOfWeekKey,
      date: formatDate(tripStartDate, dayNumber - 1),
      places: groupedPlaces,
      totalDistance: totalDistance, // This is from processRouteData
      routeData: {
        nodeIds: nodeIds,
        linkIds: linkIds,
        segmentRoutes: segmentRoutes // Ensure segmentRoutes is passed through
      },
      interleaved_route: interleaved_route
    };
  });

  return result;
};
