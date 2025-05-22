/**
 * Types related to itinerary structure and places with time
 */

import { Place } from './base-types';
import { RouteData } from './route-data';

// Place with time information
export interface ItineraryPlaceWithTime {
  id: string; // Changed from string | number to string
  name: string;
  category: string;
  
  timeBlock: string;
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number;
  travelTimeToNext?: string;

  // Geographic and Detailed Information
  x: number;
  y: number;
  address: string;
  road_address: string;
  phone: string;
  description: string;
  rating: number;
  image_url: string;
  homepage: string;

  geoNodeId?: string;
  isFallback?: boolean;
  
  isSelected?: boolean;
  isCandidate?: boolean;
  // Potentially other fields from Place if needed
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
