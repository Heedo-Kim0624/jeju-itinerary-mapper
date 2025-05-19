
import { ItineraryPlaceWithTime, Place } from '@/types/supabase';

/**
 * Calculates the distance between two geographical coordinates using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in kilometers.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // Handle invalid coordinates
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
      typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.warn(`[calculateDistance] Invalid coordinates: (${lat1}, ${lon1}) to (${lat2}, ${lon2})`);
    return 0;
  }
  
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
  if (!places || places.length < 2) {
    return 0;
  }

  for (let i = 0; i < places.length - 1; i++) {
    const place1 = places[i];
    const place2 = places[i+1];
    
    // Ensure places exist and have valid coordinates
    if (!place1 || !place2) {
      console.warn(`[calculateTotalDistance] Missing place at index ${i} or ${i+1}`);
      continue;
    }
    
    // Check for numeric coordinates
    const y1 = parseFloat(String(place1.y));
    const x1 = parseFloat(String(place1.x));
    const y2 = parseFloat(String(place2.y));
    const x2 = parseFloat(String(place2.x));
    
    if (!isNaN(y1) && !isNaN(x1) && !isNaN(y2) && !isNaN(x2)) {
      totalDistance += calculateDistance(y1, x1, y2, x2);
    } else {
      console.warn(`[calculateTotalDistance] Invalid coordinates for place ${place1.name} or ${place2.name}: ` +
                   `(${place1.y}, ${place1.x}) to (${place2.y}, ${place2.x})`);
    }
  }
  
  // 거리를 소수점 둘째 자리까지 반올림
  return Math.round(totalDistance * 100) / 100;
};
