import { CategoryName } from '@/utils/categoryUtils';
export type { CategoryName } from '@/utils/categoryUtils';

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

// 새로운 타입 정의: 여행 날짜와 시간
export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

// 수정된 타입 정의: 일정 생성 API 요청 페이로드
export interface SchedulePayload {
  selected_places: SchedulePlace[]; // Changed from SelectedPlace[]
  candidate_places: SchedulePlace[]; // Changed from SelectedPlace[]
  start_datetime: string; // ISO8601 타임스탬프
  end_datetime: string;   // ISO8601 타임스탬프
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

// Define RouteSegment interface here as it's used by ItineraryDay
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
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (예: "30분")
  timeBlock?: string; // 요청사항 7 - "09:00 - 10:00" 형식 또는 "09:00 도착" 등
  nodeId?: string; // 장소의 GeoJSON 노드 ID
  distanceToNext?: number; // 다음 장소까지의 거리 (meters)
  nextPlaceName?: string; // 다음 장소 이름
  // travelTimeToNext is already here from earlier, but confirm type, maybe number in minutes
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
