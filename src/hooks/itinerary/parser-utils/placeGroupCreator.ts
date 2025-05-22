
import { ItineraryPlaceWithTime, ServerScheduleItem } from '@/types/core';
import { extractTimeFromTimeBlock, calculateDepartTime } from './timeUtils';
import { createAirportEntry, createItineraryPlace, isAirport } from './placeFactory';

// This interface describes the expected structure of items after processing by getProcessedItemDetails
// It's based on the properties used within this function and in placeFactory
interface ProcessedScheduleItemDetails {
  item: ServerScheduleItem; // The original server item
  name: string;
  category: string;
  x: number;
  y: number;
  address: string;
  road_address: string;
  phone: string;
  description: string;
  rating: number;
  image_url: string;
  homepage: string;
  isFallback: boolean;
  numericId: number | null;
  geoNodeId?: string;
}

export const groupAndCreateItineraryPlaces = (
  processedDayItems: ProcessedScheduleItemDetails[],
  dayNumber: number
): ItineraryPlaceWithTime[] => {
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

    // Check if it's an airport and if it's the first or last item of the day
    // Using processedDayItems.length as 'i' and 'group' are relative to processedDayItems
    const isFirstItemInDay = i === 0;
    const isLastItemGroupInDay = (i + group.length -1) === (processedDayItems.length - 1);

    if (isAirport(firstInGroup.name) && (isFirstItemInDay || isLastItemGroupInDay)) {
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
  return groupedPlaces;
};
