
import { ServerScheduleItem, SelectedPlace as CoreSelectedPlace } from '@/types/core';
import { findMostSimilarString } from '@/utils/stringUtils';

/**
 * Finds detailed place information from local lists (ID-based, name-based, or similarity-based).
 */
export const findPlaceDetails = (
  item: ServerScheduleItem,
  mappedPlaceById: Map<string, CoreSelectedPlace>,
  mappedPlaceByName: Map<string, CoreSelectedPlace>
): CoreSelectedPlace | undefined => {
  let selectedPlace: CoreSelectedPlace | undefined = undefined;
  const serverPlaceIdStr = item.id !== undefined ? String(item.id) : undefined;

  // 1. Try to find by ID
  if (serverPlaceIdStr) {
    selectedPlace = mappedPlaceById.get(serverPlaceIdStr);
  }

  // 2. If not found by ID, try by exact place name
  if (!selectedPlace) {
    selectedPlace = mappedPlaceByName.get(item.place_name);
  }

  // 3. If still not found, try by place name without spaces
  if (!selectedPlace) {
    const nameWithoutSpaces = item.place_name.replace(/\s+/g, '');
    selectedPlace = mappedPlaceByName.get(nameWithoutSpaces);
  }

  // 4. If still not found, try by string similarity
  if (!selectedPlace) {
    const candidateNames = Array.from(mappedPlaceByName.keys());
    const similarMatch = findMostSimilarString(item.place_name, candidateNames); // Threshold is 0.7 by default
    if (similarMatch.match) {
      selectedPlace = mappedPlaceByName.get(similarMatch.match);
      console.log(
        `[findPlaceDetails] Matched server place "${item.place_name}" (ID: ${serverPlaceIdStr || 'N/A'}) to local place "${similarMatch.match}" with similarity ${similarMatch.similarity.toFixed(2)}.`
      );
    }
  }
  
  return selectedPlace;
};
