import { Place } from './supabase'; // Assuming Place might be needed as a base
import { CategoryName } from '@/utils/categoryUtils'; // Added this based on usage in useScheduleParser

// 서버로 전송할 장소 데이터 간소화 구조 (기존 유지)
export interface SchedulePlace {
  id: number | string;
  name: string;
}

// 여행 날짜와 시간 (기존 유지)
export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

// 일정 생성 API 요청 페이로드 (기존 유지)
export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string; // ISO8601 타임스탬프 (로컬 시간 기준)
  end_datetime: string;   // ISO8601 타임스탬프 (로컬 시간 기준)
}

// 서버 응답의 schedule 배열 내 아이템 타입
export interface ServerScheduleItem {
  time_block: string;
  place_type: string;
  place_name: string;
  id?: number | string;
  node_id?: number | string;
  address?: string;
  phone?: string;
  description?: string;
  rating?: number;
  image_url?: string;
  road_address?: string;
  homepage?: string;
  x?: number; // For compatibility with extractPlacesForDay
  y?: number; // For compatibility with extractPlacesForDay
  place_info?: {
    x?: number;
    y?: number;
    node_id?: number | string;
  };
}

// 서버 응답의 route_summary 배열 내 아이템 타입
export interface ServerRouteSummaryItem {
  day: string; 
  status: string; 
  total_distance_m: number;
  interleaved_route: (string | number)[];
}

// 새로운 서버 응답 구조 정의 (전체)
export interface NewServerScheduleResponse {
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
  total_reward?: number;
  start_datetime?: string; // Added for typeCompatibility.ts
}

// Client-side Itinerary Place type (기존 ItineraryPlace에서 이름 변경 및 필드 유지)
export interface ItineraryPlaceWithTime extends Place {
  // id, name, x, y, category 등 Place에서 상속
  node_id?: number | string;
  timeBlock?: string; // 예: "10:00-12:00" 또는 "10:00 도착"
  arriveTime?: string; // 예: "10:00"
  departTime?: string; // 예: "12:00"
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (문자열)
  // Place에서 상속받으므로 road_address, homepage 등 포함
}

// Client-side Itinerary Day type (사용자 제안에 따라 수정)
export interface ItineraryDay {
  day: number;
  dayOfWeek: string; // 추가: 'Mon', 'Tue' 등
  date: string;      // 추가: '05/21' 등
  places: ItineraryPlaceWithTime[]; // ItineraryPlaceWithTime 사용
  totalDistance: number;
  interleaved_route?: (string | number)[]; // 옵셔널로 변경 및 유지
  routeData?: RouteData; // 옵셔널로 변경 및 유지
}

// RouteData for ItineraryDay (기존 유지, 순서 변경)
export interface RouteData {
  nodeIds?: string[];
  linkIds: string[];
}

// 누락된 타입 추가 (사용자 제안)
export interface ExtractedRouteData {
  nodeIds: string[];
  linkIds: string[];
}

export interface ParsedRoute {
  from: string | number;
  to: string | number;
  links: (string | number)[];
}

// 서버 응답이 NewServerScheduleResponse 타입인지 확인하는 타입 가드 (기존 유지)
export function isNewServerScheduleResponse(
  response: any
): response is NewServerScheduleResponse {
  // ... keep existing code (isNewServerScheduleResponse implementation)
  return (
    response &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    Array.isArray(response.schedule) &&
    // response.schedule.every((item: any) =>
    //   item && typeof item.place_name === 'string' 
    // ) && // Simplified check for brevity, can be expanded
    Array.isArray(response.route_summary) &&
    response.route_summary.every((item: any) =>
      item &&
      typeof item.day === 'string' &&
      // typeof item.status === 'string' && // status can be optional or validated if always present
      typeof item.total_distance_m === 'number' &&
      Array.isArray(item.interleaved_route)
    )
  );
}

// PlannerServerRouteResponse 및 관련 타입 가드 (기존 코드에 있었다면 유지)
// ... keep existing code (PlannerServerRouteResponse, isPlannerServerRouteResponseArray, convertPlannerResponseToNewResponse)
export interface PlannerServerRouteResponse {
  date: string;
  nodeIds: number[];
}

export function isPlannerServerRouteResponseArray(
  response: any
): response is PlannerServerRouteResponse[] {
  return (
    Array.isArray(response) &&
    (response.length === 0 ||
      (response.length > 0 &&
        typeof response[0] === 'object' &&
        response[0] !== null &&
        typeof response[0].date === 'string' &&
        Array.isArray(response[0].nodeIds)))
  );
}

export function convertPlannerResponseToNewResponse(
  plannerResponse: PlannerServerRouteResponse[]
): NewServerScheduleResponse {
  const routeSummaryItems: ServerRouteSummaryItem[] = plannerResponse.map(item => {
    const date = new Date(item.date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      day: dayOfWeek,
      status: 'OK', 
      total_distance_m: 0, 
      interleaved_route: item.nodeIds,
    };
  });

  const scheduleItems: ServerScheduleItem[] = [];
  plannerResponse.forEach(dayData => {
    dayData.nodeIds.forEach((nodeId, index) => {
      if (index % 2 === 0 && typeof nodeId === 'number') { 
        scheduleItems.push({
          id: nodeId,
          node_id: nodeId,
          place_name: `장소 ${nodeId}`, 
          place_type: 'unknown', 
          time_block: '시간 정보 없음', 
        });
      }
    });
  });
  
  const result: NewServerScheduleResponse = {
    schedule: scheduleItems,
    route_summary: routeSummaryItems,
  };
  return result;
}

// ServerRouteResponse for map context (기존 유지)
export interface ServerRouteResponse {
  nodeIds: (string | number)[];
  linkIds: (string | number)[];
  interleaved_route?: (string | number)[];
}
