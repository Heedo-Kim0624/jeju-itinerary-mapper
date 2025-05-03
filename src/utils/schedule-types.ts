
import { Place } from '@/types/supabase';

// Place with a flag indicating if it's been used in the itinerary
export interface PlaceWithUsedFlag extends Place {
  usedInItinerary?: boolean;
}

// Schedule table interface - maps day and hour to a place or null
export interface ScheduleTable {
  [dayHour: string]: Place | null; // Format: "요일_시간": Place object or null
}

// Itinerary score interface for evaluating itineraries
export interface ItineraryScore {
  score: number;
  totalDistance: number;
  placesCount: number;
}

// Itinerary day interface
export interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

// Schedule item for each time slot
export interface ScheduleItem {
  time_block: string;
  place_type: string;
  place_name: string;
}

// Full day schedule
export interface DaySchedule {
  day: number;
  items: ScheduleItem[];
}
