/**
 * Types related to itinerary structure and places with time
 */

import { Place } from './base-types';
import { RouteData } from './route-data';

// Details fetched from Supabase for a place
export interface PlaceDetails {
  id: number; // Supabase ID, always number
  place_name: string;
  road_address?: string;
  lot_address?: string;
  latitude?: number;  // y
  longitude?: number; // x
  location?: string;  // e.g. "제주시", "서귀포시"
  // Add any other fields fetched from Supabase *_information tables
  // Example: specific fields from accommodation_information, etc.
  // phone?: string; // Already in ItineraryPlaceWithTime
  // homepage?: string; // Already in ItineraryPlaceWithTime
}

// Place with time information
export interface ItineraryPlaceWithTime {
  id: string | number;          // Unique identifier for this itinerary entry (can be original place ID or generated)
  name: string;                 // Name of the place
  category: string;             // Category of the place (e.g., '음식점', '관광지')
  
  timeBlock: string;            // Original time block string from server, or formatted start time. e.g., "Tue_0900" or "09:00"
  arriveTime?: string;          // Formatted arrival time, e.g., "09:00"
  departTime?: string;          // Formatted departure time, e.g., "10:30"
  stayDuration?: number;        // Duration of stay in minutes
  travelTimeToNext?: string;    // Estimated travel time to the next place, e.g., "15분"
  
  // Geographic and Detailed Information (aligned with Place to ensure assignability)
  x: number;                   // Longitude (required)
  y: number;                   // Latitude (required)
  address: string;             // Full address (required)
  road_address: string;        // Road address (required)
  phone: string;               // Phone number (required)
  description: string;         // Place description (required)
  rating: number;              // Place rating (required)
  image_url: string;           // URL for an image of the place (required)
  homepage: string;            // URL for the place's homepage (required)
  
  // For GeoJSON based routing if applicable
  geoNodeId?: string;  // ID of the corresponding node in GeoJSON data
      
  isFallback?: boolean;         // True if detailed information could not be found or was defaulted
  details?: PlaceDetails;       // Optional: Detailed information fetched from Supabase
  
  // Properties for compatibility with Place selection logic
  isSelected?: boolean;
  isCandidate?: boolean;
}

// Day itinerary interface
export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number; // Distance in km
  routeData: RouteData;
  interleaved_route: (string | number)[];
  dayOfWeek: string; // e.g., "Mon", "Tue"
  date: string;      // e.g., "05/21" (MM/DD format)
}

// Response parsing result
export interface ServerResponseParsingResult {
  itineraryDays: ItineraryDay[];
  error?: string;
}
