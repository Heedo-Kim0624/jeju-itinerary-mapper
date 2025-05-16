import { definitions } from './supabaseGenerated'; // Assuming this is where raw Supabase types come from

export type PlaceCategory = 'accommodation' | 'attraction' | 'restaurant' | 'cafe' | 'unknown';

export interface Place {
  id: string | number;
  name: string;
  category: PlaceCategory;
  x: number; // longitude
  y: number; // latitude
  address?: string;
  phone?: string;
  description?: string;
  rating?: number;
  image_url?: string;
  road_address?: string;
  homepage?: string;
  isSelected?: boolean;
  isCandidate?: boolean; // True if this place was added by auto-completion logic
  geoNodeId?: string; // For GeoJSON node mapping
  geoNodeDistance?: number; // Distance to mapped GeoJSON node
}

export interface SelectedPlace extends Place {
  // SelectedPlace might have additional properties if needed
}

// Server expects SchedulePlace with potentially numeric ID
export interface SchedulePlace {
  id: number | string;
  name: string;
}

export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string; // e.g., "10:00"
  travelTimeToNext?: string; // e.g., "30분"
  time_block?: string; // Added for requirement e.g., "09:00"
}

export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number;
  routeData?: { // This is client-side representation of route data for a day
    nodeIds?: (string | number)[];
    linkIds?: (string | number)[];
    interleaved_route?: (string | number)[];
  };
}

export type KeywordRank = {
  keyword: string;
  count: number;
};

// Add any other types that might be in this file
export interface Region {
  id: string;
  name: string;
  // ... other properties
}

export type Tables<T extends keyof definitions> = definitions[T]['Row'];
export type Views<T extends keyof definitions> = definitions[T]['Row'];
export type Functions<T extends keyof definitions> = definitions[T]['Args'];

// Example usage:
// type ProfileData = Tables<'profiles'>;
// type UserViewData = Views<'user_details_view'>;
// type FunctionArgs = Functions<'my_rpc_function'>;
