import { CategoryName, ItineraryPlaceWithTime, Place } from '@/types/index'; // ItineraryDay는 index.ts에서 가져옵니다.

// 서버 응답 명세에 따른 타입 정의
export interface ScheduleEntry {
  id: number; // 장소의 NODE_ID
  place_name: string;
  place_type: CategoryName | string; // 서버에서는 "restaurant" 등 문자열로 올 수 있음
  time_block: string; // "Tue_0900", "Fri_1700" 등의 시간 슬롯
}

export interface DailyRouteSummary {
  day: string; // 요일 (예: "Tue", "Wed" ...)
  interleaved_route: number[]; // [장소 NODE_ID, 링크 ID, 장소 NODE_ID, 링크 ID, ..., 장소 NODE_ID]
  status: string; // 예: "성공"
  total_distance_m: number; // 당일 총 이동 거리 (m 단위)
  places_scheduled?: string[]; // 프롬프트에 있었지만, 명세에는 없어서 옵셔널로 유지
  places_routed?: string[]; // 프롬프트에 있었지만, 명세에는 없어서 옵셔널로 유지
}

// 기존 NewServerScheduleResponse를 대체 (사용자 명세 기반 ServerResponse)
export interface NewServerScheduleResponse {
  schedule: ScheduleEntry[];
  route_summary: DailyRouteSummary[];
  total_reward?: number; // 기존 필드가 있다면 유지
}

// MapContext 등에서 사용될 개별 날짜의 경로 데이터 타입 (DailyRouteSummary와 동일하게 사용)
export type ServerRouteResponse = DailyRouteSummary;

// ServerRouteSummaryItem은 DailyRouteSummary로 대체됩니다.
export type ServerRouteSummaryItem = DailyRouteSummary;


// 서버로 전송할 장소 데이터 간소화 구조
export interface SchedulePlace {
  id: number | string;
  name: string;
}

// 수정된 타입 정의: 일정 생성 API 요청 페이로드
export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string; // ISO8601 타임스탬프 (로컬 시간 기준)
  end_datetime: string;   // ISO8601 타임스탬프 (로컬 시간 기준)
}

// 경로 데이터 인터페이스 (interleaved_route를 사용하므로 nodeIds, linkIds는 파싱 결과)
export interface RouteData {
  nodeIds: number[]; // 파싱된 노드 ID (장소)
  linkIds: number[]; // 파싱된 링크 ID
  segmentRoutes?: SegmentRoute[]; // 기존 유지
}

export interface SegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: number[];
  linkIds: number[];
}

// 경로 응답에서 추출한 파싱된 경로 세그먼트
export interface ParsedRoute { // routeParser.ts 에서 사용
  from: number; // 장소 노드 ID (숫자)
  to: number;   // 장소 노드 ID (숫자)
  links: number[]; // 링크 ID 배열 (숫자)
}

export interface ExtractedRouteData {
  nodeIds: number[]; // 장소 노드 ID
  linkIds: number[];
}


// 타입 가드 함수들 (새로운 타입 구조에 맞게 수정 또는 확인 필요)
export function isNewServerScheduleResponse(
  response: any
): response is NewServerScheduleResponse {
  return (
    response &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    Array.isArray(response.schedule) &&
    Array.isArray(response.route_summary) &&
    response.schedule.every(
      (item: any) =>
        item &&
        typeof item.id === 'number' &&
        typeof item.place_name === 'string' &&
        typeof item.place_type === 'string' &&
        typeof item.time_block === 'string'
    ) &&
    response.route_summary.every(
      (item: any) =>
        item &&
        typeof item.day === 'string' &&
        Array.isArray(item.interleaved_route) &&
        item.interleaved_route.every((n: any) => typeof n === 'number') &&
        typeof item.status === 'string' &&
        typeof item.total_distance_m === 'number'
    )
  );
}

// PlannerServerRouteResponse 및 관련 타입 가드는 현재 명세와 직접적 관련이 적어 보이지만,
// 기존 코드 의존성이 있다면 유지 또는 수정합니다. 지금은 그대로 둡니다.
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
        Array.isArray(response[0].nodeIds) &&
        response[0].nodeIds.every((id: any) => typeof id === 'number')))
  );
}
