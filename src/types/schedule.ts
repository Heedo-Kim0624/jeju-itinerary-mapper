// Import from current module (@/types)
import { Place, CategoryName, RouteData } from '.';

export interface ItineraryPlace extends Place {
    category: CategoryName; // Make category mandatory and use the correct type
    startTime?: string; // Example: "09:00"
    endTime?: string;   // Example: "10:30"
    duration?: number;  // Duration in minutes, e.g., 90
  }
  
  export interface ItineraryDay {
    day: number; // e.g., 1, 2, 3
    date: string; // e.g., "2024-07-15"
    dayOfWeek: string; // e.g., "Mon", "Tue"
    places: ItineraryPlace[];
    routeData?: RouteData; // Optional route data for the day
    totalDistance?: number; // Optional total travel distance for the day in km
  }
  
  // Full itinerary structure
  export interface Itinerary {
    id: string; // Unique ID for the itinerary
    title?: string; // Optional title for the itinerary
    startDate: string; // ISO date string
    endDate: string;   // ISO date string
    days: ItineraryDay[];
    totalEstimatedCost?: number; // Optional total estimated cost
  }
