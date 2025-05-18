import { CategoryName } from '@/utils/categoryUtils';

// 프롬프트 1에서 요청된 타입: SchedulePayload
export interface SchedulePayload {
  selected_places: Array<{ id: number | string, name: string }>;
  candidate_places: Array<{ id: number | string, name: string }>;
  start_datetime: string;
  end_datetime: string;
}

// 프롬프트 1에서 요청된 타입: ItineraryPlace
export interface ItineraryPlace {
  id: number | string;
  name: string;
  x: number;
  y: number;
  category: string;
  node_id?: number;
  time?: string;
  address?: string; // 기존 Place 타입의 필드들을 참고하여 추가
  phone?: string;
  description?: string;
  rating?: number;
  image_url?: string;
  // isSelected, isCandidate 등 UI 상태 관련 필드는 필요에 따라 추가
}

// 프롬프트 1에서 요청된 타입: ItineraryDay
export interface ItineraryDay {
  day: number;
  dayOfWeek: string; // 예: "Mon", "Tue"
  date: string; // 예: "05/20"
  places: ItineraryPlace[];
  totalDistance: number; // km 단위
  interleaved_route: number[] | (string | number)[]; // 프롬프트 1은 number[], 기존은 (string | number)[]. 호환성 위해 union.
  routeData: any; // 프롬프트 1은 any. 기존엔 RouteData.
}

// 프롬프트 1에서 요청된 타입: NewServerScheduleResponse
export interface NewServerScheduleResponse {
  total_reward: number;
  schedule: any[]; // 서버에서 오는 상세 일정 아이템 배열
  route_summary: Array<{
    day?: string; // 기존 ServerRouteSummaryItem 과의 호환성을 위해 옵셔널 추가 (프롬프트 1에는 없었음)
    status?: string; // 호환성 위해 추가
    total_distance_m?: number; // 호환성 위해 추가 & 프롬프트 1의 interleaved_route_length 와 유사
    interleaved_route_length: number; // 프롬프트 1 명시
    first_20_interleaved: number[]; // 프롬프트 1 명시. 실제로는 전체 경로일 수 있음.
    interleaved_route?: (string | number)[]; // 기존 ServerRouteSummaryItem 필드 유지 시도
  }>;
}

export interface ServerRouteSummaryItem {
  day: string; // 예: "Mon", "Tue" (요일 문자열)
  status: string;
  total_distance_m: number;
  interleaved_route: (string | number)[];
}

export interface ServerRouteResponse {
  nodeIds: (string | number)[];
  linkIds: (string | number)[];
  interleaved_route?: (string | number)[];
}

export interface SimpleServerRouteResponse {
  date: string;
  nodeIds: number[];
}

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
  categoryDetail?: string;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string;
}

export interface SelectedPlace extends Place {
  category: CategoryName;
  isSelected: boolean;
  isCandidate: boolean;
}

export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

export interface ServerScheduleItem {
  time_block: string;
  place_type: string;
  place_name: string;
  id?: number | string;
  node_id?: number;
  place_id?: number | string;
  place_info?: {
    node_id?: number;
    x?: number;
    y?: number;
  };
}

export interface PlannerServerRouteResponse {
  date: string;
  nodeIds: number[];
}

export interface ServerScheduleResponse {
  itinerary: {
    day: number;
    places: any[];
    totalDistance?: number;
  }[];
  routes?: Record<string, ServerRouteResponse>;
}

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

export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number;
  travelTimeToNext?: string;
  timeBlock?: string;
}

export interface RouteSegment {
  from: string;
  to: string;
  links: string[];
}

export interface ParsedRouteData {
  day: number;
  segments: RouteSegment[];
  totalDistanceMeters: number;
}

export interface ParsedRoute {
  from: string | number;
  to: string | number;
  links: (string | number)[];
}

export interface ExtractedRouteData {
    nodeIds: string[];
    linkIds: string[];
}

export function convertPlannerResponseToNewResponse(
  plannerResponse: PlannerServerRouteResponse[]
): NewServerScheduleResponse {
  console.log('[convertPlannerResponseToNewResponse] 변환 시작:', plannerResponse);

  const routeSummaryItems: NewServerScheduleResponse['route_summary'] = plannerResponse.map(item => {
    return {
      interleaved_route_length: 0,
      first_20_interleaved: item.nodeIds,
    };
  });

  const scheduleItems: ServerScheduleItem[] = [];
  plannerResponse.forEach(dayData => {
    dayData.nodeIds.forEach((nodeId, index) => {
      if (index % 2 === 0 && typeof nodeId === 'number') {
        scheduleItems.push({
          id: nodeId,
          place_name: `장소 ${nodeId}`,
          place_type: 'unknown',
          time_block: '시간 정보 없음',
        });
      }
    });
  });
  
  const result: NewServerScheduleResponse = {
    total_reward: 0,
    schedule: scheduleItems,
    route_summary: routeSummaryItems,
  };
  console.log('[convertPlannerResponseToNewResponse] 변환 완료:', result);
  return result;
}

export function isNewServerScheduleResponse(
  response: any
): response is NewServerScheduleResponse {
  return (
    response &&
    typeof response === 'object' &&
    !Array.isArray(response) &&
    typeof response.total_reward === 'number' &&
    Array.isArray(response.schedule) &&
    Array.isArray(response.route_summary) &&
    response.route_summary.every((item: any) =>
      item &&
      typeof item.interleaved_route_length === 'number' &&
      Array.isArray(item.first_20_interleaved)
    )
  );
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
