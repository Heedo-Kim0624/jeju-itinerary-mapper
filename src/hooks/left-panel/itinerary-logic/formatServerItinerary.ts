
import {
  NewServerScheduleResponse,
  ServerScheduleItem,
  ItineraryDay,
  ItineraryPlaceWithTime,
  CategoryName,
} from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '@/hooks/itinerary/itineraryUtils';

/**
 * Formats the server response from the schedule generation API into ItineraryDay objects.
 * @param serverResponse The raw response from the server.
 * @param tripStartDate The start date of the trip.
 * @returns A formatted array of ItineraryDay objects, or an empty array if formatting fails or data is invalid.
 */
export const formatServerItinerary = (
  serverResponse: NewServerScheduleResponse,
  tripStartDate: Date
): ItineraryDay[] => {
  if (
    !serverResponse ||
    !serverResponse.schedule ||
    serverResponse.schedule.length === 0 ||
    !serverResponse.route_summary ||
    serverResponse.route_summary.length === 0
  ) {
    console.warn('[formatServerItinerary] Invalid server response or empty schedule/route_summary.');
    return [];
  }

  const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return serverResponse.route_summary.map((summary, index) => {
    const routeDayAbbrev = summary.day.substring(0, 3);

    // Calculate the actual date for this day of the itinerary
    const actualDayDate = new Date(tripStartDate);
    actualDayDate.setDate(tripStartDate.getDate() + index); // Assumes route_summary is ordered and index is day offset

    const placeNodeIdsInRoute = summary.interleaved_route
      .filter((_id, idx) => idx % 2 === 0) // Get even indices (place IDs)
      .map(id => String(id));

    const dayPlaces: ItineraryPlaceWithTime[] = serverResponse.schedule
      .filter(item => {
        const itemIdStr = item.id !== undefined ? String(item.id) : null;
        const scheduleItemDayAbbrev = item.time_block.substring(0, 3);
        return itemIdStr && placeNodeIdsInRoute.includes(itemIdStr) && scheduleItemDayAbbrev === routeDayAbbrev;
      })
      .map((item: ServerScheduleItem): ItineraryPlaceWithTime => ({
        id: item.id?.toString() || item.place_name, // Fallback for safety
        name: item.place_name,
        category: item.place_type as CategoryName, // Type assertion
        timeBlock: item.time_block,
        x: item.x_coord ?? 0, // Use nullish coalescing for defaults
        y: item.y_coord ?? 0,
        address: item.address || '',
        phone: '', // Not provided by server
        description: '', // Not provided by server
        rating: 0, // Not provided by server
        image_url: '', // Not provided by server
        road_address: item.road_address || '',
        homepage: '', // Not provided by server
        isSelected: false, // Default value
        isCandidate: false, // Default value
        // arriveTime, departTime, stayDuration, travelTimeToNext are not in ServerScheduleItem
        // These would need to be derived or set later if essential at this stage.
      }));
    
    const tripDayNumber = index + 1;

    return {
      day: tripDayNumber,
      places: dayPlaces,
      totalDistance: summary.total_distance_m / 1000, // Convert meters to km
      interleaved_route: summary.interleaved_route.map(String), // Ensure all are strings
      routeData: {
        nodeIds: placeNodeIdsInRoute,
        linkIds: summary.interleaved_route.filter((_id, idx) => idx % 2 !== 0).map(String), // Odd indices for link IDs
        segmentRoutes: [], // Default, as not provided by server
      },
      dayOfWeek: getDayOfWeekString(actualDayDate),
      date: getDateStringMMDD(actualDayDate),
    };
  });
};
