import { Place } from '@/types/supabase';

// Define ItineraryPlace. Since Place now has optional road_address and homepage,
// ItineraryPlace can be simpler. If ItineraryPlace has no other unique properties,
// it could even be an alias: export type ItineraryPlace = Place;
// For now, let's ensure it's at least compatible.
export interface ItineraryPlace extends Place {
  // ItineraryPlace specific fields, if any, can be added here.
  // If 'id', 'name', 'category' were Omit'ted to redefine them,
  // ensure they are compatible with Place or serve a specific purpose.
  // Based on the original Omit, it seems they were redefined, so let's keep that structure
  // but ensure it aligns with the now more flexible Place type.
  id: string; 
  name: string; 
  category: string; 
  // road_address and homepage are now optional in the base Place type,
  // so explicitly making them optional here is consistent.
  road_address?: string; 
  homepage?: string;
}

// Define the RouteData interface
export interface RouteData {
  nodeIds: string[];
  linkIds: string[];
}

// Define the ItineraryDay interface with all required properties
export interface ItineraryDay {
  day: number;
  places: ItineraryPlace[];
  route?: RouteData; // Consolidated route information
  totalDistance: number;
  startTime?: string;
  endTime?: string;
  routeNodeIds?: string[]; // Or string[] | number[] if mixed types are possible
}

// Define the Itinerary interface
export interface Itinerary {
  id: string;
  title?: string;
  schedule: ItineraryDay[];
  totalDays: number;
  createdAt?: string;
}

// Type guard to check if an object conforms to the ItineraryDay interface
export function isItineraryDay(obj: any): obj is ItineraryDay {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.day === 'number' &&
    Array.isArray(obj.places) &&
    typeof obj.totalDistance === 'number' &&
    (obj.route === undefined || (typeof obj.route === 'object' && obj.route !== null && Array.isArray(obj.route.nodeIds) && Array.isArray(obj.route.linkIds)))
  );
}

// Utility function to convert to ItineraryDay, ensuring compatibility
export function convertToSupabaseItineraryDay(day: any): ItineraryDay {
  let routeValue: RouteData | undefined = undefined;
  // Ensure day.route is an object and has the correct array properties before assigning
  if (day.route && typeof day.route === 'object' && 
      Array.isArray(day.route.nodeIds) && Array.isArray(day.route.linkIds)) {
    routeValue = {
        nodeIds: day.route.nodeIds.map(String), // Ensure string array
        linkIds: day.route.linkIds.map(String)  // Ensure string array
    };
  } else {
    // console.warn("Route data is missing or malformed for day:", day.day);
  }

  // Ensure places are correctly typed as ItineraryPlace[]
  const placesValue: ItineraryPlace[] = (day.places || []).map((p: any) => ({
    ...p, // spread existing place properties
    id: String(p.id || ''),
    name: String(p.name || 'Unknown Place'),
    category: String(p.category || 'default'),
    x: Number(p.x || 0), // Ensure numeric coordinates
    y: Number(p.y || 0),
    road_address: String(p.road_address || ''),
    homepage: String(p.homepage || ''),
    // Ensure all other required Place properties are present or have defaults
    address: String(p.address || ''),
    phone: String(p.phone || ''),
    description: String(p.description || ''),
    rating: Number(p.rating || 0),
    review_count: Number(p.review_count || 0),
    image_url: String(p.image_url || '')
  }));

  return {
    day: Number(day.day),
    places: placesValue,
    totalDistance: Number(day.totalDistance || 0),
    route: routeValue,
    startTime: day.startTime,
    endTime: day.endTime
  };
}

// Export Place from itinerary types using 'export type'
export type { Place as SupabasePlace } from '@/types/supabase'; // Alias to avoid naming conflict if needed locally
