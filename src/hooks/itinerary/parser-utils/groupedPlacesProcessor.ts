
import { ServerScheduleItem, SelectedPlace, ItineraryPlaceWithTime } from '@/types/core';
// SchedulePayload is removed as it's not directly used for getProcessedItemDetails anymore
import { getProcessedItemDetails } from './scheduleItemProcessor';
import { groupAndCreateItineraryPlaces } from './placeGroupCreator';
import { addTravelTimesToPlaces } from './travelTimeProcessor';

/**
 * Builds a list of grouped itinerary places for a day, including processing,
 * grouping, creating place entries, and calculating travel times.
 */
export const buildGroupedItineraryPlaces = (
  dayItemsOriginal: ServerScheduleItem[],
  // lastPayload: SchedulePayload | null, // Removed
  // currentSelectedPlaces: SelectedPlace[], // Removed
  dayNumber: number
): ItineraryPlaceWithTime[] => {
  // Step 1: Process raw server schedule items to get detailed place information
  // The type of `processedDayItems` elements implicitly matches `ProcessedScheduleItemDetails`
  // defined in `scheduleItemProcessor.ts` based on the return type of `getProcessedItemDetails`.
  // `getProcessedItemDetails` now uses PlaceContext internally.
  const processedDayItems = dayItemsOriginal.map(serverItem =>
    getProcessedItemDetails(serverItem) // Parameters updated
  );

  // Step 2: Group consecutive places and create initial ItineraryPlaceWithTime objects
  const placesWithoutTravelTime = groupAndCreateItineraryPlaces(processedDayItems, dayNumber);
  
  // Step 3: Calculate and add travel times between the places
  const placesWithTravelTime = addTravelTimesToPlaces(placesWithoutTravelTime);

  return placesWithTravelTime;
};

