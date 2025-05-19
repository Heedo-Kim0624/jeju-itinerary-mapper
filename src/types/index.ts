
import { CategoryName } from '@/utils/categoryUtils';

// 기본 장소 인터페이스
export interface Place {
  id: string;
  name: string;
  address: string;
  phone: string;
  category: string; // Could be CategoryName or a broader string type
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
  category: CategoryName; // Strictly CategoryName here
  isSelected: boolean;
  isCandidate: boolean;
}

// 서버로 전송할 장소 데이터 간소화 구조
export interface SchedulePlace {
  id: number | string;
  name: string;
}

// 일정 생성 API 요청 페이로드
export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string; // ISO8601 타임스탬프
  end_datetime: string; // ISO8601 타임스탬프
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
  day: string;                   // "Tue", "Wed", "Thu", "Fri" 등
  status: string;                // "성공" 등
  total_distance_m: number;      // 미터 단위 총 거리
  places_routed: string[];       // 경로에 포함된 장소 이름 배열
  places_scheduled: string[];    // 일정에 포함된 장소 이름 배열
  interleaved_route: number[];    // NODE_ID와 LINK_ID가 번갈아 있는 배열
}

// 서버 응답 인터페이스
export interface NewServerScheduleResponse {
  total_reward?: number;
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
}

// 경로 데이터 인터페이스
export interface RouteData {
  nodeIds: string[];
  linkIds: string[];
  segmentRoutes?: SegmentRoute[];
}

// 세그먼트 경로 인터페이스
export interface SegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: string[];
  linkIds: string[];
}

// 서버 경로 응답 (지도 표시에 사용될 수 있음)
export interface ServerRouteResponse {
  nodeIds: number[]; // Note: Often these are numbers from server, converted to string in RouteData
  linkIds: number[];
  interleaved_route?: number[];
}

// 일정 장소 인터페이스 (Place에 시간 정보 추가)
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (예: "30분")
  timeBlock?: string; // "09:00 - 10:00" 형식 또는 "09:00 도착" 등
  // geoNodeId is already in Place
}

// 일정 일자 인터페이스
export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number; // km 단위
  routeData: RouteData;
  interleaved_route?: (string | number)[]; // Can be mixed if IDs are strings
  dayOfWeek: string; // 예: "Mon", "Tue"
  date: string;      // 예: "05/21" (MM/DD 형식)
}

// 타입 검사 함수 (값으로 사용되므로 import type이 아닌 일반 import 필요)
export function isNewServerScheduleResponse(obj: any): obj is NewServerScheduleResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.schedule) &&
    Array.isArray(obj.route_summary) &&
    obj.route_summary.length > 0 && // Ensure route_summary is not empty
    obj.route_summary.every((item: any) =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.day === 'string' &&
      item.hasOwnProperty('status') && // Use hasOwnProperty for safer check
      item.hasOwnProperty('total_distance_m') &&
      Array.isArray(item.places_scheduled) &&
      Array.isArray(item.places_routed) &&
      Array.isArray(item.interleaved_route)
    )
  );
}

// Raw Data Types (from user's previous plan)
export interface RawServerResponse {
  total_reward?: number;
  schedule?: ServerScheduleItem[]; // Use more specific type if possible
  route_summary?: ServerRouteSummaryItem[]; // Use more specific type
  [key: string]: any; // For any other properties
}

