
import { Place } from '@/types/supabase';

// Define ItineraryPlace for consistency across the application
export interface ItineraryPlace extends Place {
  id: string;
  name: string;
  category: string;
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
  routeNodeIds?: string[]; // Route node IDs for rendering on the map
  routeData?: string[]; // Legacy support for old property name (string array format)
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
    typeof obj.totalDistance === 'number'
  );
}

// Utility function to convert from one ItineraryDay type to another
export function convertToSupabaseItineraryDay(day: any): ItineraryDay {
  return {
    day: day.day,
    places: day.places,
    totalDistance: day.totalDistance || 0, // Default to 0 if not provided
    routeNodeIds: day.routeNodeIds,
    routeData: day.routeData,
    startTime: day.startTime,
    endTime: day.endTime
  };
}
