
import { ItineraryDay } from "@/hooks/use-itinerary";

// 타입 정의 완료
export interface ServerScheduleItem {
  time_block: string;
  place_name: string;
  place_type: string;
}

export interface ServerRouteSummaryItem {
  day: string;
  status: string;
  total_distance_m: number;
  places_scheduled: string[];
  places_routed: string[];
  interleaved_route: number[];
}

export interface NewServerScheduleResponse {
  total_reward?: number;
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
}

export interface ServerRouteResponse {
  nodeIds: string[];
  linkIds: string[];
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
    place_type?: string;
    isRequired?: boolean;
  }[];
}

export function isNewServerScheduleResponse(obj: any): obj is NewServerScheduleResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.schedule) && 
    obj.schedule.length > 0 &&
    Array.isArray(obj.route_summary) && 
    obj.route_summary.length > 0 && 
    obj.route_summary.every((item: any) => 
      typeof item === 'object' && 
      typeof item.day === 'string' && 
      Array.isArray(item.places_routed) &&
      Array.isArray(item.interleaved_route)
    )
  );
}

export interface AddScheduleCompletionParams {
  itinerary: ItineraryDay[];
  dayIndex?: number;
}
