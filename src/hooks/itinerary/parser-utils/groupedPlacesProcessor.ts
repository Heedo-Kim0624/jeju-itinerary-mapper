import { ServerScheduleItem, SchedulePayload, SelectedPlace as CoreSelectedPlace, ItineraryPlaceWithTime, Place } from '@/types/core';
import { getProcessedItemDetails } from './scheduleItemProcessor';
import { groupAndCreateItineraryPlaces } from './placeGroupCreator';
import { addTravelTimesToPlaces } from './travelTimeProcessor';

/**
 * Builds a list of grouped itinerary places for a day, including processing,
 * grouping, creating place entries, and calculating travel times.
 */
export const buildGroupedItineraryPlaces = (
  dayItemsOriginal: ServerScheduleItem[],
  lastPayload: SchedulePayload | null,
  getPlaceById: (id: number | string | null | undefined) => Place | undefined, // Added
  getPlaceByName: (name:string) => Place | undefined, // Added
  currentSelectedPlacesOriginal: CoreSelectedPlace[], // For ID hints from payload
  dayNumber: number
): ItineraryPlaceWithTime[] => {
  // Step 1: Process raw server schedule items to get detailed place information
  // The type of `processedDayItems` elements implicitly matches `ProcessedScheduleItemDetails`
  // defined in `placeGroupCreator.ts` based on the return type of `getProcessedItemDetails`.
  const processedDayItems = dayItemsOriginal.map(serverItem =>
    getProcessedItemDetails(serverItem, lastPayload, getPlaceById, getPlaceByName, currentSelectedPlacesOriginal) // Pass new params
  );

  // Step 2: Group consecutive places and create initial ItineraryPlaceWithTime objects
  const placesWithoutTravelTime = groupAndCreateItineraryPlaces(processedDayItems, dayNumber);
  
  // Step 3: Calculate and add travel times between the places
  const placesWithTravelTime = addTravelTimesToPlaces(placesWithoutTravelTime);

  return placesWithTravelTime;
};
