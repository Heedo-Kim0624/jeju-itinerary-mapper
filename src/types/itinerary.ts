import { Place } from '@/types/supabase';

// Define ItineraryPlace for consistency across the application
// Ensure ItineraryPlace includes all fields from Place, plus its own specific ones.
// The properties 'id', 'name', 'category' are explicitly part of ItineraryPlace,
// and it inherits others like address, phone, x, y, etc., from Place.
export interface ItineraryPlace extends Place {
  id: string; // Overrides Place.id if it exists and has a different type, or adds it.
  name: string; // Ditto for name.
  category: string; // Ditto for category.
  // Other fields like x, y, address, description, etc., are inherited from Place.
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
  if (day.route && typeof day.route === 'object' && Array.isArray(day.route.nodeIds) && Array.isArray(day.route.linkIds)) {
    routeValue = day.route;
  } else if (Array.isArray(day.routeNodeIds) && Array.isArray(day.routeLinkIds)) { // Example for handling old structure if needed
    routeValue = { nodeIds: day.routeNodeIds, linkIds: day.routeLinkIds };
  } else if (Array.isArray(day.routeData)) {
    // Handle legacy routeData (string[]) if it represents nodeIds. This part is tricky without knowing its exact old meaning.
    // Assuming for now legacy routeData might have been just nodeIds.
    // If linkIds are also needed, this conversion might be insufficient or require more logic.
    // For now, if it's a string array, let's assume it might be nodeIds for a RouteData object, leaving linkIds empty.
    // This is a placeholder for potentially more complex legacy conversion.
    // routeValue = { nodeIds: day.routeData, linkIds: [] };
    // Better to log a warning or handle as undefined if structure is ambiguous
    console.warn("Legacy routeData (string[]) found and cannot be directly converted to RouteData object. Route will be undefined.", day);
  }

  return {
    day: day.day,
    places: day.places,
    totalDistance: day.totalDistance || 0,
    route: routeValue,
    startTime: day.startTime,
    endTime: day.endTime
  };
}

// Export Place from itinerary types using 'export type'
export type { Place };
