
/**
 * Types related to itinerary structure and places with time
 */

import { Place } from './base-types';
import { RouteData } from './route-data';

// Place with time information
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // Duration in minutes
  travelTimeToNext?: string; // Travel time to next place (e.g., "30분")
  timeBlock?: string; // Format like "09:00 - 10:00" or "09:00 도착"
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
