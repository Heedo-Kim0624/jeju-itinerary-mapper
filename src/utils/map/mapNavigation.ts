import { Place } from '@/types/supabase';
import { ItineraryPlace } from '@/types/itinerary';

// Define common locations in Jeju
export const JEJU_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  '서귀포': { lat: 33.2542, lng: 126.5581 },
  '제주': { lat: 33.4996, lng: 126.5312 },
  '애월': { lat: 33.4630, lng: 126.3319 },
  '조천': { lat: 33.5382, lng: 126.6435 },
  '한림': { lat: 33.4101, lng: 126.2690 },
  '성산': { lat: 33.4371, lng: 126.9318 },
  '구좌': { lat: 33.5545, lng: 126.7536 },
  '안덕': { lat: 33.2585, lng: 126.3436 },
  '대정': { lat: 33.2302, lng: 126.2506 },
  '중문': { lat: 33.2546, lng: 126.4288 },
  '남원': { lat: 33.2780, lng: 126.7062 },
  '표선': { lat: 33.3278, lng: 126.8302 },
  // Center of Jeju Island as a fallback
  '제주도': { lat: 33.3846, lng: 126.5535 }, 
};

/**
 * Utility function to convert a region name to coordinates
 * @param regionName The name of the region
 * @returns Coordinates {lat, lng} or null if not found
 */
export const getRegionCoordinates = (regionName: string): { lat: number; lng: number } | null => {
  if (!regionName) return null;
  
  const normalized = regionName.trim();
  return JEJU_LOCATIONS[normalized] || null;
};

/**
 * Type guard to check if a value is a valid Place object
 */
export const isPlace = (value: any): value is Place => {
  return value && typeof value === 'object' && 
    'x' in value && typeof value.x === 'number' && 
    'y' in value && typeof value.y === 'number';
};

/**
 * Type guard to check if a value is a valid coordinates object
 */
export const isCoordinates = (value: any): value is { lat: number; lng: number } => {
  return value && typeof value === 'object' && 
    'lat' in value && typeof value.lat === 'number' && 
    'lng' in value && typeof value.lng === 'number';
};

/**
 * Converts a string location name to coordinates if it's a known location
 * @param locationOrCoords Location name or coordinates
 * @returns Coordinates object or null if not found
 */
export const resolveLocationToCoordinates = (
  locationOrCoords: string | Place | ItineraryPlace | { lat: number; lng: number }
): { lat: number; lng: number } | null => {
  // If it's already coordinates, return as is
  if (isCoordinates(locationOrCoords)) {
    return locationOrCoords;
  }
  
  // If it's a Place object, convert x,y to lat,lng
  if (isPlace(locationOrCoords)) {
    return { lat: locationOrCoords.y, lng: locationOrCoords.x };
  }
  
  // If it's a string, try to find coordinates for the location name
  if (typeof locationOrCoords === 'string') {
    return getRegionCoordinates(locationOrCoords);
  }
  
  return null;
};
