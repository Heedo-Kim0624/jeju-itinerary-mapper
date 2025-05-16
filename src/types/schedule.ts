
import { SelectedPlace, SchedulePlace } from './supabase'; // Import SchedulePlace

// 서버로 전송할 장소 데이터 간소화 구조 - This is now imported from supabase.ts
// export interface SchedulePlace {
//   id: number | string;
//   name: string;
// }

// 서버에 전송할 일정 생성 요청 Payload
export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string;
  end_datetime: string;
}

// 서버로부터 받은 경로 응답 구조
export interface ServerRouteResponse {
  nodeIds?: (string | number)[]; // Changed to allow numbers too, as per interleaved_route
  linkIds?: (string | number)[]; // Changed to allow numbers too
  status?: string;
  total_distance_m?: number;
  interleaved_route?: (string | number)[];
}

// 서버로부터 받은 일정 항목 응답 구조
export interface ScheduleItem {
  time_block: string;
  place_type: string;
  place_name: string;
  place_id?: number | string;
}

// 경로 파싱을 위한 추가 인터페이스
export interface ParsedRoute {
  from: string | number;
  to: string | number;
  links: (string | number)[];
}

// 경로 요약 정보
export interface RouteSummary {
  day: string;
  status: string;
  total_distance_m: number;
  interleaved_route: (string | number)[];
}

// 서버 응답 전체 구조
export interface ServerScheduleResponse {
  schedule?: ScheduleItem[];
  route_summary?: RouteSummary[];
  itinerary?: any[]; // 서버가 반환하는 일정 정보
  routes?: Record<number | string, ServerRouteResponse>; // 일자별 경로 정보
}

// For useMapFeatures hook
export interface ExtractedRouteData {
  nodeIds: string[];
  linkIds: string[];
}
