
import { ItineraryPlaceWithTime } from '@/types/core';
import { formatTravelTime, estimateTravelTimeFromDistance } from './timeUtils';
import { calculateDistance } from '@/utils/distance';

export const addTravelTimesToPlaces = (
  places: ItineraryPlaceWithTime[]
): ItineraryPlaceWithTime[] => {
  if (!places || places.length === 0) {
    return [];
  }

  const updatedPlaces = places.map(place => ({ ...place })); // Create a new array with copied objects

  // Calculate and update travel times between places
  for (let k = 0; k < updatedPlaces.length - 1; k++) {
    const currentPlace = updatedPlaces[k];
    const nextPlace = updatedPlaces[k + 1];

    // Calculate distance between places using the utility from @/utils/distance
    const distanceKm = calculateDistance(currentPlace.x, currentPlace.y, nextPlace.x, nextPlace.y);

    // Estimate travel time based on distance
    const travelTimeMinutes = estimateTravelTimeFromDistance(distanceKm);

    // Update travel time in formatted string
    currentPlace.travelTimeToNext = formatTravelTime(travelTimeMinutes);
  }
  
  // Ensure the last place has "-" for travelTimeToNext if not already set or if it's "N/A" from factory
  // formatTravelTime already returns "-" for 0 or negative minutes, so this covers cases
  // where travelTimeToNext might not have been touched by the loop (i.e., the last item).
  // The placeFactory initializes travelTimeToNext to "N/A" or a value, this ensures consistency.
  if (updatedPlaces.length > 0) {
    const lastPlace = updatedPlaces[updatedPlaces.length - 1];
    if (!lastPlace.travelTimeToNext || lastPlace.travelTimeToNext === "N/A") {
         lastPlace.travelTimeToNext = "-";
    }
  }

  return updatedPlaces;
};
