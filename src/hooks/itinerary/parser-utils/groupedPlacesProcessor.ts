
import { ServerScheduleItem, SchedulePayload, SelectedPlace, ItineraryPlaceWithTime } from '@/types/core';
import { getProcessedItemDetails } from './scheduleItemProcessor';
import { extractTimeFromTimeBlock, calculateDepartTime, formatTravelTime, estimateTravelTimeFromDistance } from './timeUtils';
import { calculateDistance } from '@/utils/distance';
import { createAirportEntry, createItineraryPlace, isAirport } from './placeFactory';

/**
 * Groups itinerary places by combining consecutive entries for the same place
 * and calculates travel times between them.
 */
export const buildGroupedItineraryPlaces = (
  dayItemsOriginal: ServerScheduleItem[],
  lastPayload: SchedulePayload | null,
  currentSelectedPlaces: SelectedPlace[],
  dayNumber: number
): ItineraryPlaceWithTime[] => {
  const processedDayItems = dayItemsOriginal.map(serverItem =>
    getProcessedItemDetails(serverItem, lastPayload, currentSelectedPlaces)
  );

  const groupedPlaces: ItineraryPlaceWithTime[] = [];
  let i = 0;

  while (i < processedDayItems.length) {
    const currentProcessedItem = processedDayItems[i];
    let j = i;

    // Group consecutive items with the same numericId (if not null) or same name (if numericId is null)
    while (
      j < processedDayItems.length &&
      ((currentProcessedItem.numericId !== null && processedDayItems[j].numericId === currentProcessedItem.numericId) ||
        (currentProcessedItem.numericId === null && processedDayItems[j].name === currentProcessedItem.name))
    ) {
      j++;
    }

    const group = processedDayItems.slice(i, j);
    const firstInGroup = group[0];

    const stayDurationMinutes = group.length * 60; // Assuming each block is 1 hour
    const arriveTime = extractTimeFromTimeBlock(firstInGroup.item.time_block);
    const departTime = calculateDepartTime(arriveTime, stayDurationMinutes);

    const baseIdPart = String(firstInGroup.numericId || firstInGroup.name.replace(/\s+/g, '_'));
    const uniqueEntryId = `${baseIdPart}_${dayNumber}_${i}`;

    if (isAirport(firstInGroup.name) && (i === 0 || (i + group.length - 1) === dayItemsOriginal.length - 1)) {
      groupedPlaces.push(
        createAirportEntry(uniqueEntryId, firstInGroup.item.time_block, arriveTime, departTime, stayDurationMinutes, firstInGroup.numericId)
      );
    } else {
      groupedPlaces.push(
        createItineraryPlace(uniqueEntryId, firstInGroup, firstInGroup.item.time_block, arriveTime, departTime, stayDurationMinutes, firstInGroup.numericId, firstInGroup.geoNodeId)
      );
    }

    i = j;
  }

  // Calculate and update travel times between places
  for (let k = 0; k < groupedPlaces.length - 1; k++) {
    const currentPlace = groupedPlaces[k];
    const nextPlace = groupedPlaces[k + 1];

    // Calculate distance between places using the utility from @/utils/distance
    const distanceKm = calculateDistance(currentPlace.x, currentPlace.y, nextPlace.x, nextPlace.y);

    // Estimate travel time based on distance
    const travelTimeMinutes = estimateTravelTimeFromDistance(distanceKm);

    // Update travel time in formatted string
    currentPlace.travelTimeToNext = formatTravelTime(travelTimeMinutes);
  }
  
  // Ensure the last place has "N/A" or "-" for travelTimeToNext if not already set
  if (groupedPlaces.length > 0) {
    groupedPlaces[groupedPlaces.length - 1].travelTimeToNext = groupedPlaces[groupedPlaces.length - 1].travelTimeToNext || "-";
  }


  return groupedPlaces;
};
