// 기본 장소 인터페이스
export interface Place {
  id: string | number; // Allow number for geoNodeId consistency
  name: string;
  address?: string;
  phone?: string;
  category?: string; // Consider using CategoryName from '@/utils/categoryUtils' if appropriate
  description?: string;
  rating?: number;
  x: number;
  y: number;
  image_url?: string;
  road_address?: string;
  homepage?: string;
  operationTimeData?: { [key: string]: number };
  isSelected?: boolean;
  isRecommended?: boolean;
  geoNodeId?: string; // Typically string, but server might send number
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

// 선택된 장소 인터페이스 (예시, 필요시 확장)
// import { CategoryName } from '@/utils/categoryUtils'; // If strict category needed
export interface SelectedPlace extends Place {
  // category: CategoryName; 
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

// 경로 데이터 인터페이스 (표준화)
export interface RouteData {
  nodeIds: string[]; // 필수 속성으로 통일
  linkIds: string[]; // 필수 속성으로 통일
  segmentRoutes?: SegmentRoute[];
}

// 세그먼트 경로 인터페이스
export interface SegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: string[];
  linkIds: string[];
}

// 일정 장소 인터페이스
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (예: "30분")
  timeBlock?: string; // "09:00 - 10:00" 형식 또는 "09:00 도착" 등
  // geoNodeId is already in Place
}

// 일정 일자 인터페이스 (표준화)
export interface ItineraryDay {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number; // km 단위
  routeData: RouteData; // 필수 속성으로 통일, 내용도 필수
  interleaved_route?: (string | number)[]; // 서버 응답 원본 유지용
  dayOfWeek: string; // 예: "Mon", "Tue" (필수)
  date: string;      // 예: "05/21" (MM/DD 형식) (필수)
}

// 서버 스케줄 항목
export interface ServerScheduleItem {
  id?: number | string;
  time_block: string;
  place_name: string;
  place_type: string;
}

// 서버 경로 요약 항목 (사용자 제안에 따라 조정)
export interface ServerRouteSummaryItem {
  day: string;                   // "Tue", "Wed", "Thu", "Fri" 등
  status: string;                // "성공" 등
  total_distance_m: number;      // 미터 단위 총 거리
  places_scheduled?: string[];   // 일정에 포함된 장소 이름 배열 (선택적으로 변경)
  places_routed?: string[];      // 경로에 포함된 장소 이름 배열 (선택적으로 변경)
  interleaved_route: (string | number)[]; // NODE_ID와 LINK_ID가 번갈아 있는 배열
}

// 서버 응답 인터페이스
export interface NewServerScheduleResponse {
  total_reward?: number;
  schedule: ServerScheduleItem[];
  route_summary: ServerRouteSummaryItem[];
}

// 서버 경로 응답 (지도 표시에 사용될 수 있음)
export interface ServerRouteResponse {
  nodeIds: number[];
  linkIds: number[];
  interleaved_route?: number[]; // Optional as per original
}

// 타입 검 함수 (업데이트)
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
      Array.isArray(item.interleaved_route)   // Only interleaved_route is required
    )
  );
}

// Raw Data Types (from user's previous plan) - Can be removed if not used
export interface RawServerResponse {
  total_reward?: number;
  schedule?: ServerScheduleItem[];
  route_summary?: ServerRouteSummaryItem[];
  [key: string]: any;
}

// 카테고리 이름 타입 (영문 기반, 올바른 철자 사용)
export type CategoryName = 'accommodation' | 'landmark' | 'restaurant' | 'cafe';

// 카테고리 이름 타입 (한글 기반)
export type CategoryNameKorean = '숙소' | '관광지' | '음식점' | '카페';

// 카테고리 매핑 객체 (영문 -> 한글, 올바른 철자 사용)
export const CATEGORY_MAPPING: Record<CategoryName, CategoryNameKorean> = {
  'accommodation': '숙소',
  'landmark': '관광지',
  'restaurant': '음식점',
  'cafe': '카페'
};

// 역방향 매핑 객체 (한글 -> 영문, 올바른 철자 사용)
export const CATEGORY_MAPPING_REVERSE: Record<CategoryNameKorean, CategoryName> = {
  '숙소': 'accommodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe'
};

// 문자열 (한글 또는 영문, 또는 잘못된 영문 철자 'accomodation')을 영문 CategoryName으로 변환하는 함수
export function toCategoryName(category: string | CategoryName | CategoryNameKorean): CategoryName {
  if (category === 'accomodation') { // 잘못된 철자 수정
    return 'accommodation';
  }
  if (category in CATEGORY_MAPPING_REVERSE) {
    return CATEGORY_MAPPING_REVERSE[category as CategoryNameKorean];
  }
  if (['accommodation', 'landmark', 'restaurant', 'cafe'].includes(category)) {
    return category as CategoryName;
  }
  console.warn(`[toCategoryName] Unknown category: ${category}, defaulting to 'landmark'.`);
  return 'landmark'; // 기본값 또는 오류 처리
}

// 문자열 (한글 또는 영문, 또는 잘못된 영문 철자 'accomodation')을 한글 CategoryNameKorean으로 변환하는 함수
export function toCategoryNameKorean(category: string | CategoryName | CategoryNameKorean | null | undefined): CategoryNameKorean {
  if (!category) {
    console.warn(`[toCategoryNameKorean] Received null or undefined category, defaulting to '관광지'.`);
    return '관광지'; // Handle null/undefined input
  }
  let normalizedCategory = category;
  if (category === 'accomodation') { // 잘못된 철자 수정
    normalizedCategory = 'accommodation';
  }

  if (normalizedCategory in CATEGORY_MAPPING) {
    return CATEGORY_MAPPING[normalizedCategory as CategoryName];
  }
  if (['숙소', '관광지', '음식점', '카페'].includes(normalizedCategory)) {
    return normalizedCategory as CategoryNameKorean;
  }
  console.warn(`[toCategoryNameKorean] Unknown category: ${normalizedCategory}, defaulting to '관광지'.`);
  return '관광지'; // 기본값 또는 오류 처리
}

// 카테고리 결과 상태 (LeftPanel.tsx 에서 setShowCategoryResult 에 사용됨)
export interface CategoryResultState {
  showCategoryResult: CategoryName | null;
  selectedRegions: string[];
  selectedKeywords: string[];
}
