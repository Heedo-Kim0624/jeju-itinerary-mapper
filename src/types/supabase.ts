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
  road_address?: string;
  homepage?: string;
  operationTimeData?: {
    [key: string]: number;
  };
  isSelected?: boolean;
  isRecommended?: boolean;
  geoNodeId?: string;
  geoNodeDistance?: number;
  categoryDetail?: string;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string;
  weight?: number;
  isCandidate?: boolean;
  raw?: any;
}

export interface SelectedPlace {
  id: string;
  name: string;
}

export interface SchedulePayload {
  selected_places: SelectedPlace[];
  candidate_places: SelectedPlace[];
  start_datetime: string;
  end_datetime: string;
}

// 새로운 타입 정의: 여행 날짜와 시간
export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

// 경로 데이터 인터페이스 추가 - This was duplicated, ensure only one definition if identical or merge if different.
// Assuming RouteData from itinerary.ts is the primary one, or they need to be reconciled.
// For now, keeping the existing one here if it's used locally, but it might be a source of confusion.
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
  places: Place[];
  totalDistance: number;
  routeData?: RouteData;
}

// Update ItineraryPlaceWithTime interface with correct property names
export interface ItineraryPlaceWithTime extends Place {
  arriveTime?: string;
  departTime?: string;
  stayDuration?: number;
  travelTimeToNext?: string;
  timeBlock?: string; // time_block 대신 camelCase로 추가
}
