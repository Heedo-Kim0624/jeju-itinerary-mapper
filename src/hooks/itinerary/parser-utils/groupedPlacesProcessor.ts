
import { ServerScheduleItem, SelectedPlace, ItineraryPlaceWithTime } from '@/types/core';
// SchedulePayload is removed as it's not directly used for getProcessedItemDetails anymore
import { getProcessedItemDetails } from './scheduleItemProcessor';
import { groupAndCreateItineraryPlaces } from './placeGroupCreator';
import { addTravelTimesToPlaces } from './travelTimeProcessor';
import type { DetailedPlace } from '@/types/detailedPlace';
import type { PlaceData } from '@/hooks/data/useSupabaseDataFetcher';

/**
 * Builds a list of grouped itinerary places for a day, including processing,
 * grouping, creating place entries, and calculating travel times.
 */
export const buildGroupedItineraryPlaces = (
  dayItemsOriginal: ServerScheduleItem[],
  getPlaceDetailsByIdCallback: (id: number) => DetailedPlace | PlaceData | undefined,
  dayNumber: number
): ItineraryPlaceWithTime[] => {
  // Step 1: Process raw server schedule items to get detailed place information
  // The type of `processedDayItems` elements implicitly matches `ProcessedScheduleItemDetails`
  // defined in `scheduleItemProcessor.ts` based on the return type of `getProcessedItemDetails`.
  const processedDayItems = dayItemsOriginal.map(serverItem =>
    getProcessedItemDetails(serverItem, getPlaceDetailsByIdCallback) // Pass the callback here
  );

  // Step 2: Group consecutive places and create initial ItineraryPlaceWithTime objects
  const placesWithoutTravelTime = groupAndCreateItineraryPlaces(processedDayItems, dayNumber);
  
  // Step 3: Calculate and add travel times between the places
  const placesWithTravelTime = addTravelTimesToPlaces(placesWithoutTravelTime);

  return placesWithTravelTime;
};

