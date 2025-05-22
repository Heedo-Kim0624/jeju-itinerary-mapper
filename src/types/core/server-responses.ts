/**
 * Server response type definitions
 */

// Server schedule item
export interface ServerScheduleItem {
  id?: number | string;
  time_block: string;
  place_name: string;
  place_type: string;
  stay_duration_minutes?: number; // 추가된 필드
  route_info_to_next?: {
    duration_str?: string;
    distance_m?: number;
  }; // 추가된 필드
  x?: number; // 좌표 정보 추가
  y?: number; // 좌표 정보 추가
}

// Server route summary item
export interface ServerRouteSummaryItem {
  day: string;                   // "Tue", "Wed", "Thu", "Fri" etc
  status: string;                // "성공" etc
  total_distance_m: number;      // Distance in meters
  places_routed?: string[];      // Array of place names included in route (optional)
  places_scheduled?: string[];   // Array of place names included in schedule (optional)
  interleaved_route: (string | number)[]; // NODE_ID and LINK_ID alternately
  segment_routes?: any[];        // 세그먼트 별 경로 정보 (추가됨)
}

// Server response interface
export interface NewServerScheduleResponse {
  total_reward?: number;
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
}

// Raw server response type
export interface RawServerResponse {
  total_reward?: number;
  schedule?: ServerScheduleItem[];
  route_summary?: ServerRouteSummaryItem[];
  [key: string]: any; // Other properties
}

// Server response for planner
export interface PlannerServerRouteResponse {
  date: string;       // e.g., '2025-05-21'
  nodeIds: number[];  // e.g., [placeId1, linkId1, intermediateNodeId1, linkId2, ..., placeIdN]
}
