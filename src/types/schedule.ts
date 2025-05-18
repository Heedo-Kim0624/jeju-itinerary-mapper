import { CategoryName } from '@/utils/categoryUtils';

// 서버로 전송할 장소 데이터 간소화 구조
export interface SchedulePlace {
  id: number | string;
  name: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  phone: string;
  category: string; // 실제로는 CategoryName 타입이어야 할 수 있음
  description: string;
  rating: number;
  x: number;
  y: number;
  image_url: string;
  road_address: string;
  homepage: string;
  operationTimeData?: {
    [key: string]: number;
  };
  isSelected?: boolean;
  isRecommended?: boolean;
  geoNodeId?: string;
  geoNodeDistance?: number;
  weight?: number;
  isCandidate?: boolean;
  raw?: any;

  // 빌드 에러 해결을 위해 옵셔널 필드로 추가
  categoryDetail?: string;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string;
}

export interface SelectedPlace extends Place {
  category: CategoryName; // 이 부분은 CategoryName으로 강제
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
export interface ServerScheduleItem {
  time_block: string;
  place_type: string; // 서버에서 오는 카테고리 문자열 (e.g., "restaurant")
  place_name: string;
  id?: number | string; // 장소 ID (서버에서 제공한다면)
  // 서버 응답에 따라 추가 필드 정의 가능
}

export interface ServerRouteSummaryItem {
  day: string; // 예: "Mon", "Tue" (요일 문자열)
  status: string;
  total_distance_m: number;
  interleaved_route: (string | number)[];
}

// 기존 NewServerScheduleResponse 타입은 유지
export interface NewServerScheduleResponse {
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
  // 서버 응답에 다른 최상위 키가 있다면 여기에 추가
}

// 서버 응답의 일관성을 위한 타입 정의 (사용자 플랜 파트 1용)
// 이 타입은 이미 use-schedule-generator.ts 에서 사용되고 있으므로 유지합니다.
export interface PlannerServerRouteResponse {
  date: string;       // 예: '2025-05-21'
  nodeIds: number[];  // 예: [장소1_ID, 링크1_ID, 중간노드1_ID, 링크2_ID, ..., 장소N_ID]
}

// 서버 경로 응답 (각 날짜별)
export interface ServerRouteResponse {
  nodeIds: (string | number)[];
  linkIds: (string | number)[];
  interleaved_route?: (string | number)[]; // 요청사항 4, 5 - 추가됨
  // 여기에 다른 경로 관련 필드가 있다면 추가
}

// 서버 전체 일정 응답
export interface ServerScheduleResponse {
  itinerary: { // 각 날짜별 일정
    day: number;
    places: any[]; // 실제로는 서버에서 오는 장소 정보 타입 (예: PlaceId 또는 Place 객체 일부)
    totalDistance?: number;
    // 여기에 time_block 같은 정보가 포함될 수 있음
  }[];
  routes?: Record<string, ServerRouteResponse>; // key는 day (예: "1", "2")
  // 여기에 다른 전체 일정 관련 필드가 있다면 추가
}

// 경로 데이터 인터페이스 추가
export interface RouteData {
  nodeIds?: string[];
  linkIds?: string[];
  segmentRoutes?: SegmentRoute[];
}

export interface SegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: string[];
  linkIds: string[];
}

// Re-define RouteSegment here or import from supabase if identical and appropriate
export interface RouteSegment {
  fromPlaceName: string;
  fromNodeId: string;
  toPlaceName: string;
  toNodeId: string;
  distance: number; // meters
  nodeCount: number;
  linkCount: number;
  nodes: string[];
  links: string[];
}

// ItineraryDay 인터페이스 확장
export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number; // in km
  routeData?: RouteData;
  interleaved_route?: (string | number)[];
  dayOfWeek?: string; // 예: "Mon", "Tue"
  date?: string; // 예: "05/20"
  routeSegments?: RouteSegment[]; // 구간별 상세 정보
}

// Update ItineraryPlaceWithTime interface with correct property names
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string | number; // 다음 장소까지 이동 시간 (예: "30분" or number of minutes)
  timeBlock?: string;
  nodeId?: string; // 장소의 GeoJSON 노드 ID
  distanceToNext?: number; // 다음 장소까지의 거리 (meters)
  nextPlaceName?: string; // 다음 장소 이름
}

// 새로운 인터페이스: 서버에서 받은 경로 데이터 파싱을 위한 인터페이스
export interface RouteSegment {
  from: string; // 출발 노드 ID
  to: string;   // 도착 노드 ID
  links: string[]; // 링크 ID 배열
}

// 경로 응답에서 추출한 파싱된 경로 세그먼트
export interface ParsedRouteData {
  day: number;
  segments: RouteSegment[];
  totalDistanceMeters: number;
}

// 클라이언트에서 파싱된 경로 세그먼트 (utils/routeParser.ts 에서 사용)
export interface ParsedRoute {
  from: string | number;
  to: string | number;
  links: (string | number)[];
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
