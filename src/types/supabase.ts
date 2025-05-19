import type { CategoryName } from '@/utils/categoryUtils';
import type { Place as BasePlace, SelectedPlace as BaseSelectedPlace, SchedulePlace as BaseSchedulePlace, SchedulePayload as BaseSchedulePayload } from './index'; // index.ts의 타입 사용

export type { CategoryName };

// Place 타입은 index.ts의 정의를 사용하거나 필요한 경우 확장합니다.
// 여기서는 Supabase 관련 필드가 BasePlace에 이미 포함되어 있다면 그대로 사용합니다.
export interface Place extends BasePlace {}

// SelectedPlace도 index.ts의 정의를 사용합니다.
export interface SelectedPlace extends BaseSelectedPlace {}

// SchedulePlace도 index.ts의 정의를 사용합니다.
export interface SchedulePlace extends BaseSchedulePlace {}

// SchedulePayload도 index.ts의 정의를 사용합니다.
export interface SchedulePayload extends BaseSchedulePayload {}


// 여행 날짜와 시간 (index.ts와 중복될 수 있으므로 한 곳에서 관리 권장)
export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

// 경로 데이터 인터페이스 (index.ts/schedule.ts와 중복)
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

// ItineraryDay 인터페이스 (index.ts/schedule.ts와 중복)
export interface ItineraryDay extends import('./schedule').ItineraryDay {}


// ItineraryPlaceWithTime 인터페이스 (index.ts/schedule.ts와 중복)
export interface ItineraryPlaceWithTime extends import('./schedule').ItineraryPlaceWithTime {}


// 서버에서 받은 경로 데이터 파싱을 위한 인터페이스 (index.ts/schedule.ts와 중복)
export interface RouteSegment extends import('./schedule').RouteSegment {}

// 경로 응답에서 추출한 파싱된 경로 세그먼트 (index.ts/schedule.ts와 중복)
export interface ParsedRouteData extends import('./schedule').ParsedRouteData {}
