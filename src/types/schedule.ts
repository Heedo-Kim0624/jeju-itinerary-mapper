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

export interface NewServerScheduleResponse {
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
  // 서버 응답에 다른 최상위 키가 있다면 여기에 추가
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

// ItineraryDay 인터페이스 확장
export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[]; // Place[] 에서 ItineraryPlaceWithTime[] 으로 변경
  totalDistance: number;
  routeData?: RouteData;
  interleaved_route?: (string | number)[]; // 요청사항 4, 5 - 추가
}

// Update ItineraryPlaceWithTime interface with correct property names
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (예: "30분")
  timeBlock?: string; // "09:00 - 10:00" 형식 또는 "09:00 도착" 등
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
