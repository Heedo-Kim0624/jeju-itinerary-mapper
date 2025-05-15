
import { Place } from './supabase';
import { ItineraryDay as BaseItineraryDay } from '@/hooks/use-itinerary-creator'; // Assuming this is the base

export interface ExtractedRouteData {
  nodeIds: string[];
  linkIds: string[];
  totalDistance: number;
}

export interface ServerRouteResponse {
  nodeIds: string[];
  linkIds: string[];
  totalDistance?: number;
  // Add any other properties expected from the server route response
}

export interface EnrichedItineraryDay extends BaseItineraryDay {
  routeData?: ExtractedRouteData;
}
