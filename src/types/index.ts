
import { CategoryName as CatNameUtil, CategoryNameKorean as CatNameKoreanUtil } from '@/utils/categoryUtils'; // 이름 충돌 방지

// 중앙 카테고리 타입 정의
export type CategoryName = 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
export type CategoryNameKorean = '숙소' | '관광지' | '음식점' | '카페';

export const CATEGORY_MAPPING: Record<CategoryName, CategoryNameKorean> = {
  accommodation: '숙소',
  landmark: '관광지',
  restaurant: '음식점',
  cafe: '카페',
};

export const CATEGORY_MAPPING_REVERSE: Record<CategoryNameKorean, CategoryName> = {
  숙소: 'accommodation',
  관광지: 'landmark',
  음식점: 'restaurant',
  카페: 'cafe',
};

export const CATEGORIES: CategoryNameKorean[] = ['숙소', '관광지', '음식점', '카페'];

export function toCategoryName(category: string): CategoryName {
  if (category === 'accomodation') { // 철자 오류 수정
    return 'accommodation';
  }
  if (Object.values(CATEGORY_MAPPING_REVERSE).includes(category as CategoryName)) {
    return category as CategoryName;
  }
  if (category in CATEGORY_MAPPING_REVERSE) {
    return CATEGORY_MAPPING_REVERSE[category as CategoryNameKorean];
  }
  console.warn(`Unknown category for toCategoryName: ${category}, defaulting to accommodation`);
  return 'accommodation'; // 기본값 또는 오류 처리
}

export function toCategoryNameKorean(category: string): CategoryNameKorean {
  if (category === 'accomodation') category = 'accommodation'; // 철자 오류 수정
  
  if (Object.values(CATEGORY_MAPPING).includes(category as CategoryNameKorean)) {
    return category as CategoryNameKorean;
  }
  if (category in CATEGORY_MAPPING) {
    return CATEGORY_MAPPING[category as CategoryName];
  }
  console.warn(`Unknown category for toCategoryNameKorean: ${category}, defaulting to 숙소`);
  return '숙소'; // 기본값 또는 오류 처리
}

export const MINIMUM_RECOMMENDATION_COUNT = (nDays: number) => ({
  landmark: 4 * nDays, // 'touristSpot' 대신 'landmark' 사용 (CategoryName 기준)
  restaurant: 3 * nDays,
  cafe: 3 * nDays,
  accommodation: nDays >= 1 ? 1 : 0, // 0박일 경우 숙소 0개 (또는 1개 정책 확인 필요)
   // 당일치기(nDays=0)일 때 숙소 1개라는 명세는 없었으므로, 0으로 두거나 1로 정책 결정. 이전 코드(isAccommodationLimitReached)는 0박일때 1개로 처리.
});


// 기본 장소 인터페이스
export interface Place {
  id: string; // DB ID (UUID or number string)
  name: string;
  address: string;
  phone: string;
  category: CategoryName | string; // 서버에서 오는 category_group_name 등은 string일 수 있음
  description: string;
  rating: number;
  x: number; // longitude
  y: number; // latitude
  image_url: string;
  road_address: string;
  homepage: string;
  operationTimeData?: { [key: string]: number };
  isSelected?: boolean;
  isRecommended?: boolean;
  geoNodeId?: string | number; // GeoJSON NODE_ID (숫자 또는 문자열 가능)
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
  category: CategoryName; // 여기서는 엄격하게 CategoryName 사용
  isSelected: boolean;
  isCandidate: boolean;
}

// 서버로 전송할 장소 데이터 간소화 구조 (src/types/schedule.ts로 이동 또는 여기서 유지)
// export interface SchedulePlace { ... } // schedule.ts에 이미 정의됨

// 일정 생성 API 요청 페이로드 (src/types/schedule.ts로 이동 또는 여기서 유지)
// export interface SchedulePayload { ... } // schedule.ts에 이미 정의됨

// 서버 스케줄 항목 (src/types/schedule.ts로 이동)
// export interface ServerScheduleItem { ... } // schedule.ts ScheduleEntry로 대체

// 서버 경로 요약 항목 (src/types/schedule.ts로 이동)
// export interface ServerRouteSummaryItem { ... } // schedule.ts DailyRouteSummary로 대체

// 서버 응답 인터페이스 (src/types/schedule.ts로 이동)
// export interface NewServerScheduleResponse { ... } // schedule.ts에 정의됨

// 경로 데이터 인터페이스 (src/types/schedule.ts로 이동 또는 여기서 유지)
export interface RouteData { // 여기서는 타입스크립트 number[]/string[] 호환성을 위해 유지
  nodeIds: (string | number)[];
  linkIds: (string | number)[];
  segmentRoutes?: SegmentRoute[];
}

// 세그먼트 경로 인터페이스
export interface SegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: (string | number)[];
  linkIds: (string | number)[];
}

// 서버 경로 응답 (지도 표시에 사용될 수 있음, src/types/schedule.ts로 이동)
// export interface ServerRouteResponse { ... } // schedule.ts에 ServerRouteResponse = DailyRouteSummary; 로 정의됨

// 일정 장소 인터페이스 (Place에 시간 정보 추가)
export interface ItineraryPlaceWithTime extends Place {
  id: string | number; // Place의 id는 string, ScheduleEntry의 id는 number. 통합 필요 -> string으로 통일 권장 또는 파싱 시 변환. 여기서는 string | number로 임시 처리
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number; // 분 단위
  travelTimeToNext?: string; // 다음 장소까지 이동 시간 (예: "30분")
  timeBlock?: string; // "09:00 - 10:00" 형식 또는 "09:00 도착" 등
}

// 일정 일자 인터페이스
export interface ItineraryDay {
  day: number; // 1일차, 2일차...
  places: ItineraryPlaceWithTime[];
  totalDistance: number; // km 단위
  routeData?: RouteData; // 파싱된 결과 (nodeIds, linkIds 포함)
  interleaved_route?: number[]; // 서버 원본 (NODE_ID, LINK_ID 순서) - number[]로 수정
  dayOfWeek: string; // 예: "Mon", "Tue"
  date: string;      // 예: "05/21" (MM/DD 형식)
}

// 타입 검사 함수 (src/types/schedule.ts로 이동)
// export function isNewServerScheduleResponse(obj: any): obj is NewServerScheduleResponse { ... } // schedule.ts에 정의됨

// Raw Data Types
export interface RawServerResponse {
  total_reward?: number;
  schedule?: import('@/types/schedule').ScheduleEntry[];
  route_summary?: import('@/types/schedule').DailyRouteSummary[];
  [key: string]: any;
}

// use-itinerary-actions.tsx 에서 사용하던 TripDetailsState 임시 정의
// 실제 정의는 use-trip-details.ts 에 있어야 함
export interface TripDetailsState {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  tripDuration: number | null;
}

