
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload, SelectedPlace as CoreSelectedPlace, ItineraryPlaceWithTime } from '@/types/core';
import { ItineraryDay, Place } from '@/types/core'; // Assuming Place is the detailed type from Supabase
import { organizeScheduleByDay } from './scheduleOrganizer';
import { organizeRouteByDay } from './routeOrganizer';
import { buildGroupedItineraryPlaces } from './groupedPlacesProcessor';
import { getDateStringMMDD, getDayOfWeekString } from './timeUtils';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser'; // Corrected import path

interface DayMapping {
  [key: string]: number; // e.g., "Mon": 1, "Tue": 2
}

export const buildItineraryDays = (
  serverResponse: NewServerScheduleResponse,
  getPlaceById: (id: number | string | null | undefined) => Place | undefined, // Added
  getPlaceByName: (name: string) => Place | undefined, // Added
  tripStartDate: Date | null,
  lastPayload: SchedulePayload | null,
  dayMapping: DayMapping,
  currentSelectedPlacesOriginal: CoreSelectedPlace[] // Added for ID hints from payload
): ItineraryDay[] => {
  const scheduleByDay = organizeScheduleByDay(serverResponse.schedule);
  const routeByDay = organizeRouteByDay(serverResponse.route_summary);
  const itineraryDays: ItineraryDay[] = [];

  console.log('[buildItineraryDays] Day mapping used:', dayMapping);
  console.log('[buildItineraryDays] Schedule by day keys:', Array.from(scheduleByDay.keys()));
  console.log('[buildItineraryDays] Route by day keys:', Array.from(routeByDay.keys()));
  
  if (!tripStartDate) {
    console.error("[buildItineraryDays] Trip start date is null, cannot calculate dates for itinerary days.");
    // Return empty or handle as an error state
    return [];
  }

  // Iterate over days present in the schedule or route summary, ensuring mapping exists
  const allDayKeys = new Set([...scheduleByDay.keys(), ...routeByDay.keys()]);

  for (const dayKey of allDayKeys) {
    const dayNumber = dayMapping[dayKey];
    if (dayNumber === undefined) {
      console.warn(`[buildItineraryDays] No mapping found for dayKey: ${dayKey}. Skipping this day.`);
      continue;
    }

    const dayItemsOriginal = scheduleByDay.get(dayKey) || [];
    const routeInfoForDay = routeByDay.get(dayKey);

    // Here, pass getPlaceById, getPlaceByName, lastPayload, and currentSelectedPlacesOriginal down to groupedPlacesProcessor
    const placesForDay: ItineraryPlaceWithTime[] = buildGroupedItineraryPlaces(
      dayItemsOriginal,
      lastPayload,
      getPlaceById, 
      getPlaceByName,
      currentSelectedPlacesOriginal,
      dayNumber
    );

    const currentDayDate = new Date(tripStartDate);
    currentDayDate.setDate(tripStartDate.getDate() + dayNumber - 1);

    const dayOfWeek = getDayOfWeekString(currentDayDate.getDay());
    const dateStr = getDateStringMMDD(currentDayDate);
    
    let totalDistanceKm = 0;
    if (routeInfoForDay && typeof routeInfoForDay.total_distance_km === 'number') {
        totalDistanceKm = routeInfoForDay.total_distance_km;
    } else if (routeInfoForDay && typeof routeInfoForDay.total_distance_m === 'number') {
        totalDistanceKm = routeInfoForDay.total_distance_m / 1000;
    }


    itineraryDays.push({
      day: dayNumber,
      dayOfWeek: dayOfWeek, // Use actual day of week based on date
      date: dateStr, // Format MM/DD
      places: placesForDay,
      totalDistance: totalDistanceKm,
      routeData: { // This might need more specific parsing if routeInfoForDay has complex structure
        nodeIds: routeInfoForDay?.node_ids?.map(String) || [],
        linkIds: routeInfoForDay?.link_ids?.map(String) || [],
        segmentRoutes: routeInfoForDay?.segment_routes || [], // Ensure this matches type
      },
      interleaved_route: routeInfoForDay?.interleaved_route || [],
    });
  }

  itineraryDays.sort((a, b) => a.day - b.day);
  return itineraryDays;
};
