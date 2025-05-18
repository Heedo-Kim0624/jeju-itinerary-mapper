
import { ItineraryDay } from "@/hooks/use-itinerary"; // Keep if used, otherwise remove

// 타입 정의 완료
export interface ServerScheduleItem {
  id?: number | string; // Added ID, make it optional or required based on actual server response
  time_block: string;
  place_name: string;
  place_type: string;
}

export interface ServerRouteSummaryItem {
  day: string;
  status: string;
  total_distance_m: number;
  places_scheduled: string[]; // Ensure this field is present
  places_routed: string[];    // Ensure this field is present
  interleaved_route: number[];
}

export interface NewServerScheduleResponse {
  total_reward?: number;
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
}

export interface ServerRouteResponse {
  nodeIds: number[]; // Changed to number[]
  linkIds: number[]; // Changed to number[]
  interleaved_route?: number[];
}

export interface SchedulePayload {
  start_timestamp: string;
  end_timestamp: string;
  start_location: string;
  end_location: string;
  places: {
    id: string;
    name: string;
    category: string;
    x: number;
    y: number;
    address: string;
    place_type?: string; // This was in the original, matches place_type in ServerScheduleItem
    isRequired?: boolean;
  }[];
}

export function isNewServerScheduleResponse(obj: any): obj is NewServerScheduleResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.schedule) &&
    // schedule can be empty if no places fit, but route_summary should reflect days
    Array.isArray(obj.route_summary) &&
    obj.route_summary.length > 0 && // Ensure there's at least one day summary
    obj.route_summary.every((item: any) =>
      typeof item === 'object' &&
      typeof item.day === 'string' &&
      item.hasOwnProperty('status') && // check for presence
      item.hasOwnProperty('total_distance_m') && // check for presence
      Array.isArray(item.places_scheduled) && // check for presence
      Array.isArray(item.places_routed) && // check for presence
      Array.isArray(item.interleaved_route)
    )
  );
}

export interface AddScheduleCompletionParams {
  itinerary: ItineraryDay[]; // Assuming ItineraryDay is from use-itinerary
  dayIndex?: number;
}

// Removed ExtractedRouteData and ParsedRoute as they seem obsolete or handled internally by new parser
// PlannerServerRouteResponse is a typo, ServerRouteResponse is used.

