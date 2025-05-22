
import { ItineraryPlaceWithTime, ServerScheduleItem, Place } from '@/types/core'; // Added Place
import { extractTimeFromTimeBlock, calculateDepartTime } from './timeUtils';
import { createAirportEntry, createItineraryPlace, isAirport } from './placeFactory';

// This interface describes the expected structure of items after processing by getProcessedItemDetails
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
  placeFromStore?: Place; // Added to carry the full Place object if available
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

    // Group consecutive items with the same numericId (if not null and not fallback) or same name (if numericId is null or fallback)
    // Prefer numericId for grouping if it's valid and not a fallback.
    // Fallback items might share names but are distinct if their original server IDs differed,
    // but here, if numericId is null (e.g. from server item not having ID), group by name.
    while (
      j < processedDayItems.length &&
      (
        (currentProcessedItem.numericId !== null && 
         processedDayItems[j].numericId === currentProcessedItem.numericId &&
         !currentProcessedItem.isFallback && !processedDayItems[j].isFallback 
        ) || // Group by valid numeric ID if available and not fallback
        (currentProcessedItem.name === processedDayItems[j].name && // Else, group by name
          (currentProcessedItem.numericId === null || processedDayItems[j].numericId === null || currentProcessedItem.isFallback || processedDayItems[j].isFallback)
        ) 
      )
    ) {
      j++;
    }
    
    const group = processedDayItems.slice(i, j);
    const firstInGroup = group[0];

    const stayDurationMinutes = group.length * 60; // Assuming each block is 1 hour
    const arriveTime = extractTimeFromTimeBlock(firstInGroup.item.time_block);
    const departTime = calculateDepartTime(arriveTime, stayDurationMinutes);

    // Use numericId if available and valid, otherwise fall back to name for unique ID part.
    // Ensure numericId from a non-fallback item is prioritized.
    let baseIdPartSource = firstInGroup;
    if (firstInGroup.isFallback && group.some(item => !item.isFallback && item.numericId !== null)) {
        baseIdPartSource = group.find(item => !item.isFallback && item.numericId !== null) || firstInGroup;
    }
    
    const baseIdPart = String(baseIdPartSource.numericId !== null ? baseIdPartSource.numericId : baseIdPartSource.name.replace(/\s+/g, '_'));
    const uniqueEntryId = `${baseIdPart}_${dayNumber}_${i}`;

    // Check if it's an airport and if it's the first or last item of the day
    const isFirstItemInDay = i === 0;
    const isLastItemGroupInDay = (i + group.length -1) === (processedDayItems.length - 1);

    if (isAirport(firstInGroup.name) && (isFirstItemInDay || isLastItemGroupInDay)) {
      groupedPlaces.push(
        createAirportEntry(uniqueEntryId, firstInGroup.item.time_block, arriveTime, departTime, stayDurationMinutes, firstInGroup.numericId)
      );
    } else {
      // Pass the potentially richer firstInGroup.placeFromStore if available
      const placeToUseForCreation = firstInGroup.placeFromStore ? 
        {...firstInGroup, ...firstInGroup.placeFromStore, id: String(firstInGroup.numericId)} : // merge, prioritize store data but keep processed id
        firstInGroup;

      groupedPlaces.push(
        createItineraryPlace(
            uniqueEntryId, 
            placeToUseForCreation, // Use the merged/store object
            firstInGroup.item.time_block, 
            arriveTime, 
            departTime, 
            stayDurationMinutes, 
            firstInGroup.numericId, // ensure this is the matched/correct numeric ID
            firstInGroup.geoNodeId // from processed item
        )
      );
    }

    i = j;
  }
  return groupedPlaces;
};
