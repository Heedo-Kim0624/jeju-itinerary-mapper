import type { CategoryName } from '@/utils/categoryUtils';
import type { Place as BasePlace } from './index'; // 이제 index.ts의 Place를 사용

// 서버로 전송할 장소 데이터 간소화 구조
export interface SchedulePlace {
  id: string; // string으로 통일
  name: string;
}

// Place 인터페이스는 index.ts의 것을 따르도록 수정
// 여기서는 index.ts의 Place와 거의 동일하므로, 직접 사용하거나 필요한 확장만 정의
export interface Place extends BasePlace {}

// SelectedPlace 인터페이스도 index.ts의 것을 따르도록 수정
export interface SelectedPlace extends BasePlace {
  isSelected: boolean;
  isCandidate: boolean;
}

// 새로운 타입 정의: 여행 날짜와 시간
export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

// 수정된 타입 정의: 일정 생성 API 요청 페이로드
export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string; // ISO8601 타임스탬프 (로컬 시간 기준)
  end_datetime: string;   // ISO8601 타임스탬프 (로컬 시간 기준)
}

// 새로운 서버 응답 구조 정의
// 사용자 프롬프트에 명시된 ScheduleEntry 와 유사
export interface ServerScheduleItem {
  id?: number | string; // 장소의 NODE_ID (서버에서 number로 올 수 있음)
  place_name: string;
  place_type: CategoryName | string; // 서버에서 오는 카테고리 문자열 (e.g., "restaurant"), CategoryName으로 변환 필요할 수 있음
  time_block: string; // "Tue_0900", "Fri_1700" 등의 시간 슬롯
}

// 사용자 프롬프트에 명시된 DailyRouteSummary 와 유사
export interface ServerRouteSummaryItem {
  day: string; // 예: "Tue", "Wed" (요일 문자열)
  interleaved_route: (string | number)[]; // [장소 NODE_ID, 링크 ID, 장소 NODE_ID, ...]
  status: string; // 예: "성공"
  total_distance_m: number; // 당일 총 이동 거리 (m 단위)
  places_scheduled?: string[]; // 추가: 일정에 포함된 장소 이름 목록
  places_routed?: string[]; // 추가: 경로 계산에 사용된 장소 이름 목록
}

export interface NewServerScheduleResponse {
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
  total_reward?: number; // 사용자 프롬프트에 있었던 필드
}

// 서버 응답의 일관성을 위한 타입 정의 (사용자 플랜 파트 1용)
export interface PlannerServerRouteResponse {
  date: string;       // 예: '2025-05-21'
  nodeIds: number[];
}

// 서버 경로 응답 (각 날짜별) - GeoJSON 경로 표시에 사용
export interface ServerRouteResponse {
  nodeIds: (string | number)[]; // 서버에서 오는 ID는 number일 수 있음
  linkIds: (string | number)[]; // 서버에서 오는 ID는 number일 수 있음
  interleaved_route?: (string | number)[];
}

// 경로 데이터 인터페이스 추가
export interface RouteData {
  nodeIds: string[]; // GeoJSON 레이어에서 사용할 때는 string으로 변환
  linkIds: string[]; // GeoJSON 레이어에서 사용할 때는 string으로 변환
  segmentRoutes?: SegmentRoute[];
}

export interface SegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: string[];
  linkIds: string[];
}

// ItineraryPlaceWithTime 인터페이스 - 기본 Place 타입 확장
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (예: "30분")
  timeBlock?: string; // "09:00 - 10:00" 형식 또는 "09:00 도착" 등
}

// ItineraryDay 인터페이스 확장
export interface ItineraryDay {
  day: number; // 1, 2, ...
  date: string; // "MM/DD" 형식
  dayOfWeek: string; // "Mon", "Tue", ...
  places: ItineraryPlaceWithTime[];
  totalDistance: number; // km 단위
  routeData?: RouteData;
  interleaved_route?: (string | number)[]; // 서버 원본 데이터
}

// 새로운 인터페이스: 서버에서 받은 경로 데이터 파싱을 위한 인터페이스
export interface RouteSegment { // src/components/rightpanel/geojson/GeoJsonTypes.ts 와 유사할 수 있음
  from: string; // 출발 노드 ID (string)
  to: string;   // 도착 노드 ID (string)
  links: string[]; // 링크 ID 배열 (string)
}

// 경로 응답에서 추출한 파싱된 경로 세그먼트
export interface ParsedRouteData {
  day: number;
  segments: RouteSegment[];
  totalDistanceMeters: number;
}

// 클라이언트에서 파싱된 경로 세그먼트 (utils/routeParser.ts 에서 사용)
export interface ParsedRoute {
  from: string | number; // 원본 ID 유지
  to: string | number;   // 원본 ID 유지
  links: (string | number)[]; // 원본 ID 유지
}

export interface ExtractedRouteData {
    nodeIds: string[];
    linkIds: string[];
}

// 타입 변환 유틸리티 함수 추가
export function convertPlannerResponseToNewResponse(
  plannerResponse: PlannerServerRouteResponse[]
): NewServerScheduleResponse {
  console.log('[convertPlannerResponseToNewResponse] 변환 시작:', plannerResponse);

  const routeSummaryItems: ServerRouteSummaryItem[] = plannerResponse.map(item => {
    const date = new Date(item.date);
    // 요일을 'Mon', 'Tue' 같은 축약 형태로 변환
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      day: dayOfWeek,
      status: 'OK', // 기본 상태값
      total_distance_m: 0, // PlannerServerRouteResponse에는 이 정보가 없으므로 기본값 또는 추후 계산
      interleaved_route: item.nodeIds, // nodeIds를 interleaved_route로 사용
      places_scheduled: [], // 추가: 일정에 포함된 장소 이름 목록
      places_routed: [], // 추가: 경로 계산에 사용된 장소 이름 목록
    };
  });

  // PlannerServerRouteResponse에는 상세 장소 정보가 없으므로,
  // schedule 항목은 route_summary의 nodeIds에�� 장소 ID로 추정되는 것들로 기본 생성하거나 비워둡니다.
  // 여기서는 route_summary를 기반으로 최소한의 schedule item을 생성 시도합니다.
  const scheduleItems: ServerScheduleItem[] = [];
  plannerResponse.forEach(dayData => {
    dayData.nodeIds.forEach((nodeId, index) => {
      // nodeIds 배열에서 짝수 인덱스(0, 2, 4...)가 장소 노드 ID라고 가정합니다.
      // 실제로는 서버가 명확한 장소 ID 리스트를 주거나, nodeIds의 의미를 명확히 해야 합니다.
      if (index % 2 === 0 && typeof nodeId === 'number') { // 링크가 아닌 노드 ID라고 가정
        scheduleItems.push({
          id: nodeId,
          place_name: `장소 ${nodeId}`, // 실제 장소 이름은 알 수 없음
          place_type: 'unknown', // 실제 카테고리 알 수 없음
          time_block: '시간 정보 없음', // 시간 정보 없음
        });
      }
    });
  });
  
  const result: NewServerScheduleResponse = {
    schedule: scheduleItems, // 간이 생성된 스케줄 또는 필요시 []
    route_summary: routeSummaryItems,
  };
  console.log('[convertPlannerResponseToNewResponse] 변환 완료:', result);
  return result;
}

// 서버 응답이 NewServerScheduleResponse 타입인지 확인하는 타입 가드
export function isNewServerScheduleResponse(
  response: any
): response is NewServerScheduleResponse {
  return (
    response &&
    typeof response === 'object' && // Ensure response is an object and not null
    !Array.isArray(response) && // Ensure response is not an array
    Array.isArray(response.schedule) &&
    Array.isArray(response.route_summary) &&
    response.schedule.every((item: any) => // Basic check for ServerScheduleItem structure
      item && // Ensure item is not null or undefined
      typeof item.place_name === 'string' &&
      typeof item.place_type === 'string' &&
      typeof item.time_block === 'string'
      // id는 옵셔널이므로 체크에서 제외하거나, 존재할 경우 타입 체크 추가
    ) &&
    response.route_summary.every((item: any) => // Basic check for ServerRouteSummaryItem structure
      item && // Ensure item is not null or undefined
      typeof item.day === 'string' &&
      typeof item.status === 'string' &&
      typeof item.total_distance_m === 'number' &&
      Array.isArray(item.interleaved_route)
    )
  );
}

// 서버 응답이 PlannerServerRouteResponse[] 타입인지 확인하는 타입 가드
export function isPlannerServerRouteResponseArray(
  response: any
): response is PlannerServerRouteResponse[] {
  return (
    Array.isArray(response) &&
    (response.length === 0 || // 빈 배열도 유효한 PlannerServerRouteResponse[]로 간주
      (response.length > 0 &&
        typeof response[0] === 'object' && // 각 요소가 객체인지 확인
        response[0] !== null &&
        typeof response[0].date === 'string' &&
        Array.isArray(response[0].nodeIds) &&
        // nodeIds 내부 요소가 숫자인지 확인 (선택적, 성능 고려)
        response[0].nodeIds.every((id: any) => typeof id === 'number')))
  );
}
