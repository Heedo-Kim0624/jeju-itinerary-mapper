
import type { CategoryName } from '@/utils/categoryUtils';

// 기본 장소 인터페이스 - id를 string으로, category를 CategoryName으로 통일
export interface Place {
  id: string; // 항상 string
  name: string;
  address: string;
  phone: string;
  category: CategoryName; // CategoryName으로 강제
  description: string;
  rating: number;
  x: number;
  y: number;
  image_url: string;
  road_address: string;
  homepage: string;
  operationTimeData?: { [key: string]: number; };
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

// 선택된 장소 인터페이스 - Place에서 파생되므로 id와 category 타입이 일치
export interface SelectedPlace extends Place {
  isSelected: boolean;
  isCandidate: boolean;
}

// 서버로 전송할 장소 데이터 간소화 구조
export interface SchedulePlace {
  id: string; // 서버 API 스펙에 따라 string 또는 number. 여기서는 string으로 통일 시도
  name: string;
}

// 일정 생성 API 요청 페이로드 (src/types/schedule.ts 와 중복 가능성 확인 필요)
export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string; // ISO8601 타임스탬프
  end_datetime: string; // ISO8601 타임스탬프
}

// 여행 상세 정보 상태 (use-itinerary-actions 에서 필요)
export interface TripDetailsState {
  dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  nDays: number | null;
}


// src/types/schedule.ts 에서 가져와서 re-export
export type {
  ServerScheduleItem,
  ServerRouteSummaryItem,
  NewServerScheduleResponse,
  RouteData,
  SegmentRoute,
  ServerRouteResponse,
  ItineraryPlaceWithTime,
  ItineraryDay,
  ParsedRouteData, // 추가
  RouteSegment, // 추가
} from './schedule';

export { isNewServerScheduleResponse } from './schedule';

// 카테고리 목록 (from categoryUtils.ts)
export const CATEGORIES: CategoryName[] = ['숙소', '관광지', '음식점', '카페'];

// 최소 추천 개수 (from use-place-auto-completion.ts)
export const MINIMUM_RECOMMENDATION_COUNT = (nDays: number) => ({
  touristSpot: 4 * Math.max(1, nDays),
  restaurant: 3 * Math.max(1, nDays),
  cafe: 3 * Math.max(1, nDays),
  accommodation: 1 * Math.max(1, nDays), // nDays가 0이 될 수 있으므로 Math.max(1, nDays)
});

// Raw Data Types (from user's previous plan) - src/types/schedule.ts 와 중복 가능성
export interface RawServerResponse {
  total_reward?: number;
  schedule?: import('./schedule').ServerScheduleItem[];
  route_summary?: import('./schedule').ServerRouteSummaryItem[];
  [key: string]: any; // For any other properties
}
