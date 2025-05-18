
import { CategoryName } from '@/utils/categoryUtils';

// 기본 장소 인터페이스
export interface Place {
  id: string;
  name: string;
  address: string;
  phone: string;
  category: string;
  description: string;
  rating: number;
  x: number;
  y: number;
  image_url: string;
  road_address: string;
  homepage: string;
  operationTimeData?: { [key: string]: number; };
  isSelected?: boolean;
  isRecommended?: boolean;
  geoNodeId?: string;
  geoNodeDistance?: number;
  weight?: number;
  isCandidate?: boolean;
  raw?: any;
  categoryDetail?: string;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string;
}

// 선택된 장소 인터페이스
export interface SelectedPlace extends Place {
  category: CategoryName;
  isSelected: boolean;
  isCandidate: boolean;
  isRequired?: boolean; // Added to match usage in useSchedulePayload
}

// 서버로 전송할 장소 데이터 간소화 구조 (Not used for main schedule payload, but kept if used elsewhere)
export interface ApiSchedulePlace {
  id: number | string;
  name: string;
}

// 일정 생성 API 요청 페이로드 (Matches useSchedulePayload.ts)
export interface SchedulePayload {
  start_timestamp: string;
  end_timestamp: string;
  start_location: string;
  end_location: string;
  places: {
    id: string;
    name: string;
    category: string; // This is the internal category string like 'restaurant'
    x: number;
    y: number;
    address: string;
    place_type?: string; // This was in the original, matches place_type in ServerScheduleItem
    isRequired?: boolean;
  }[];
}

// 서버 스케줄 항목
export interface ServerScheduleItem {
  id?: number | string;
  time_block: string;
  place_name: string;
  place_type: string;
}

// 서버 경로 요약 항목
export interface ServerRouteSummaryItem {
  day: string;
  status: string;
  total_distance_m: number;
  places_scheduled: string[];
  places_routed: string[];
  interleaved_route: number[];
}

// 서버 응답 인터페이스
export interface NewServerScheduleResponse {
  total_reward?: number;
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
}

// 경로 데이터 인터페이스
export interface RouteData {
  nodeIds: string[]; // Changed to string[] to match usage after parsing
  linkIds: string[]; // Changed to string[] to match usage after parsing
  segmentRoutes?: SegmentRoute[];
}

// 세그먼트 경로 인터페이스
export interface SegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: string[];
  linkIds: string[];
}

// 서버 경로 응답 (Raw from server, numbers are expected)
export interface ServerRouteResponse {
  nodeIds: number[];
  linkIds: number[];
  interleaved_route?: number[];
}

// 일정 장소 인터페이스
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number;
  travelTimeToNext?: string;
  timeBlock?: string;
  // geoNodeId is already in Place, no need to repeat
}

// 일정 일자 인터페이스
export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number;
  routeData: RouteData; // This is now mandatory
  interleaved_route: number[]; // Kept as number[] as it comes from server this way
  dayOfWeek: string; // Added as per user request
  date: string; // Added as per user request
}

// 타입 검사 함수
export function isNewServerScheduleResponse(obj: any): obj is NewServerScheduleResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.schedule) &&
    Array.isArray(obj.route_summary) &&
    // route_summary can be empty if the schedule generation results in no valid days.
    // However, if it exists, its items should conform to the type.
    obj.route_summary.every((item: any) =>
      typeof item === 'object' &&
      item !== null && // ensure item itself is not null
      typeof item.day === 'string' &&
      item.hasOwnProperty('status') && 
      item.hasOwnProperty('total_distance_m') &&
      Array.isArray(item.places_scheduled) &&
      Array.isArray(item.places_routed) &&
      Array.isArray(item.interleaved_route) &&
      item.interleaved_route.every((subItem: any) => typeof subItem === 'number') // interleaved_route contains numbers
    )
  );
}

// For routeParser.ts
export interface ParsedRoute {
  from: string | number;
  to: string | number;
  links: (string | number)[];
}

// For use-itinerary.ts compatibility, if CreatorItineraryDay differs, it needs to be reconciled.
// For now, assuming ItineraryDay from here is the standard.
export type { CategoryName };

// This was in src/types/schedule.ts, ensure it's defined if use-itinerary needs it
// It likely needs to be aligned with the main ItineraryDay definition.
export interface AddScheduleCompletionParams {
  itinerary: ItineraryDay[]; 
  dayIndex?: number;
}
