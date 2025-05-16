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
  selected_places: SchedulePlace[]; // Changed from SelectedPlace[]
  candidate_places: SchedulePlace[]; // Changed from SelectedPlace[]
  start_datetime: string; // ISO8601 타임스탬프
  end_datetime: string;   // ISO8601 타임스탬프
}

// 서버 응답의 개별 일정 항목 (새로운 명세 기준)
export interface ServerScheduleItem {
  time_block: string;
  place_type: string; // 실제로는 CategoryName과 매핑됨
  place_name: string;
  place_id?: string | number; // 장소 매칭을 위한 ID (서버에서 제공되길 기대)
  // 서버 응답에 따라 추가될 수 있는 필드들 (예: arriveTime, departTime, stayDuration 등)
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number;
}

// 서버 응답의 일자별 경로 요약 (새로운 명세 기준)
export interface ServerRouteSummaryItem {
  day: string; // "Tue", "Wed" 또는 일자 번호 문자열 "1", "2" 등. 파싱 필요.
  status: string;
  total_distance_m: number;
  interleaved_route: (string | number)[];
}

// 서버 전체 일정 응답 (새로운 명세 기준)
export interface ServerScheduleResponse {
  schedule: ServerScheduleItem[]; // 기존 itinerary에서 변경
  route_summary: ServerRouteSummaryItem[]; // 기존 routes에서 변경
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

// ItineraryDay 인터페이스는 유지하되, routeData와 interleaved_route의 관계를 명확히 합니다.
// interleaved_route가 주 사용 데이터가 됩니다.
export interface ItineraryDay {
  day: number; // 숫자 일차
  places: ItineraryPlaceWithTime[];
  totalDistance: number; // km 단위
  interleaved_route?: (string | number)[]; // 우선 사용
  routeData?: RouteData; // interleaved_route에서 파생되거나, 폴백용
  // 서버 응답의 'day' 문자열 (예: "Tue") 원본 저장용 (선택적)
  originalDayString?: string;
}

// Update ItineraryPlaceWithTime interface with correct property names
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (예: "30분")
  timeBlock?: string; // 요청사항 7 - "09:00 - 10:00" 형식 또는 "09:00 도착" 등
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
