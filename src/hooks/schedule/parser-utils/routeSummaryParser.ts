
import type {
  ServerRouteSummaryItem,
  ServerScheduleItem,
  ItineraryDay,
  ItineraryPlaceWithTime,
  SelectedPlace,
  SchedulePayload, // Added for createPlaceWithTimeFromSchedule
} from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '@/utils/date-utils'; // 경로 수정
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from './coordinateUtils';
// Corrected import: createPlaceWithTimeFromSchedule is now in itineraryPlaceUtils
import { createPlaceWithTimeFromSchedule } from './itineraryPlaceUtils'; 

/**
 * Parses a single route summary item along with its corresponding schedule items
 * to form one ItineraryDay.
 */
export const parseSingleRouteSummary = (
  summaryItem: ServerRouteSummaryItem,
  dayIndex: number, // This is the 0-based index from the route_summary array
  allScheduleItems: ServerScheduleItem[],
  tripStartDate: Date,
  currentSelectedPlaces: SelectedPlace[],
  dayOfWeekMap: { [key: string]: number }, // e.g., { Sun: 0, Mon: 1 ... }
  lastPayload: SchedulePayload | null // Added lastPayload
): ItineraryDay => {
  const dayKey = summaryItem.day; // e.g., "Mon", "Tue", or "Day1"

  // Filter schedule items for the current day based on the time_block prefix
  const dayScheduleItems = allScheduleItems.filter(item =>
    item.time_block.startsWith(dayKey + '_') || // For "Mon_0900"
    (dayKey.match(/^Day\d+$/) && item.time_block.startsWith(dayKey)) // For "Day1_0900"
  );

  // Determine the actual day number (1-indexed) and date
  // This logic assumes summaryItem.day can be like "Mon" or "Day1", "Day2"
  let currentDayNumber: number;
  let currentDate: Date;
  let dayOfWeekStr: string;

  if (dayKey.match(/^Day\d+$/)) { // "Day1", "Day2"
    currentDayNumber = parseInt(dayKey.replace('Day', ''), 10);
    currentDate = new Date(tripStartDate);
    currentDate.setDate(tripStartDate.getDate() + currentDayNumber - 1);
    dayOfWeekStr = getDayOfWeekString(currentDate);
  } else { // "Mon", "Tue" - calculate day number based on start date's DOW and summary DOW
    const startDayOfWeek = tripStartDate.getDay(); // 0 for Sun, 1 for Mon ...
    const summaryDayOfWeek = dayOfWeekMap[dayKey];
    let offset = summaryDayOfWeek - startDayOfWeek;
    if (offset < 0 && dayIndex > 0) { // If summary DOW is earlier in week than start, assume it's next week (if not first day)
        // This logic might be tricky if trip spans more than one week and DOWs repeat
        // A more robust way is to rely on dayIndex if route_summary is always sorted.
        offset += 7; 
    }
    currentDayNumber = dayIndex + 1; // Use array index as a more reliable day number
    currentDate = new Date(tripStartDate);
    currentDate.setDate(tripStartDate.getDate() + dayIndex); // dayIndex is 0-based
    dayOfWeekStr = getDayOfWeekString(currentDate); // Or simply dayKey if it's "Mon", "Tue"
  }
  
  const places: ItineraryPlaceWithTime[] = dayScheduleItems.map(
    (item, itemIndex) => createPlaceWithTimeFromSchedule(item, currentDayNumber, itemIndex, currentSelectedPlaces, lastPayload)
  );

  const routeNodes = summaryItem.interleaved_route ? extractAllNodesFromRoute(summaryItem.interleaved_route) : [];
  const routeLinks = summaryItem.interleaved_route ? extractAllLinksFromRoute(summaryItem.interleaved_route) : [];

  return {
    day: currentDayNumber,
    places,
    totalDistance: summaryItem.total_distance_m ? summaryItem.total_distance_m / 1000 : 0,
    routeData: {
      nodeIds: routeNodes.map(String), // Ensure string IDs
      linkIds: routeLinks.map(String), // Ensure string IDs
      segmentRoutes: summaryItem.segment_routes || [],
    },
    interleaved_route: summaryItem.interleaved_route ? summaryItem.interleaved_route.map(String) : [], // Ensure string IDs
    dayOfWeek: dayOfWeekStr,
    date: getDateStringMMDD(currentDate),
  };
};
