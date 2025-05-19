
import { ItineraryPlaceWithTime, Place } from '@/types/supabase'; // ItineraryPlaceWithTime might be from a different path if not in supabase types

/**
 * Calculates the distance between two geographical coordinates using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in kilometers.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

/**
 * Calculates the total distance for a list of places in an itinerary day.
 * @param places An array of places for the day.
 * @returns The total distance in kilometers.
 */
export const calculateTotalDistance = (places: Place[]): number => {
  let totalDistance = 0;
  if (places.length < 2) {
    return 0;
  }

  for (let i = 0; i < places.length - 1; i++) {
    const place1 = places[i];
    const place2 = places[i+1];
    // Ensure places have valid coordinates
    if (place1.y && place1.x && place2.y && place2.x) {
      totalDistance += calculateDistance(place1.y, place1.x, place2.y, place2.x);
    } else {
      console.warn(`[calculateTotalDistance] Missing coordinates for place ${place1.name} or ${place2.name}`);
    }
  }
  
  // 거리를 소수점 둘째 자리까지 반올림
  return Math.round(totalDistance * 100) / 100;
};
