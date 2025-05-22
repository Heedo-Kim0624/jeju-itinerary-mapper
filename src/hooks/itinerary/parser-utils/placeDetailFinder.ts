
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
    if (selectedPlace) {
      console.log(`[findPlaceDetails] Matched server place "${item.place_name}" by ID: ${serverPlaceIdStr}.`);
      return selectedPlace;
    }
  }

  // 2. If not found by ID, try by exact place name
  if (!selectedPlace) {
    selectedPlace = mappedPlaceByName.get(item.place_name);
    if (selectedPlace) {
      console.log(`[findPlaceDetails] Matched server place "${item.place_name}" by exact name.`);
      return selectedPlace;
    }
  }

  // 3. If still not found, try by place name without spaces
  // This assumes mappedPlaceByName might contain keys with names without spaces
  if (!selectedPlace) {
    const nameWithoutSpaces = item.place_name.replace(/\s+/g, '');
    selectedPlace = mappedPlaceByName.get(nameWithoutSpaces);
    if (selectedPlace) {
      console.log(`[findPlaceDetails] Matched server place "${item.place_name}" by name without spaces ("${nameWithoutSpaces}").`);
      return selectedPlace;
    }
  }

  // 4. If still not found, try by string similarity
  // The findMostSimilarString function now benefits from the improved normalizePlaceName via calculateStringSimilarity
  if (!selectedPlace) {
    const candidateNames = Array.from(mappedPlaceByName.keys());
    // Consider if candidates should be normalized here too, or if findMostSimilarString handles it sufficiently.
    // Current findMostSimilarString -> calculateStringSimilarity -> normalizePlaceName handles target and candidate normalization.
    const similarMatch = findMostSimilarString(item.place_name, candidateNames); // Threshold is 0.7 by default
    if (similarMatch.match) {
      selectedPlace = mappedPlaceByName.get(similarMatch.match); // Get the original CoreSelectedPlace object
      console.log(
        `[findPlaceDetails] Matched server place "${item.place_name}" (ID: ${serverPlaceIdStr || 'N/A'}) to local place "${similarMatch.match}" with similarity ${similarMatch.similarity.toFixed(2)} using enhanced normalization.`
      );
    }
  }
  
  if (!selectedPlace) {
    console.log(`[findPlaceDetails] Could not find details for server place "${item.place_name}" (ID: ${serverPlaceIdStr || 'N/A'}) after all matching attempts.`);
  }
  
  return selectedPlace;
};

