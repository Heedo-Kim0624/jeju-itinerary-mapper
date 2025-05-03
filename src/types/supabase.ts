// src/types/supabase.ts
export interface Place {
  id: number;
  name: string;
  address: string;
  category: string;
  categoryDetail: string;
  rating: number;
  reviewCount: number;
  weight?: number;
  naverLink: string;  
  instaLink: string;  
  x: number;
  y: number;
  isSelected?: boolean;
  isRecommended?: boolean;
  operatingHours?: string | Record<string, number>;
  arrival_time?: string;       // 도착 시간 (HH:MM)
  travel_time_to_next?: string; // 다음 장소까지의 이동 시간
  time_block?: string;         // 예: "1일차 오전"
}

export interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

export interface ItineraryPlaceWithTime extends Place {
  arrival_time?: string;       // 도착 시간 (HH:MM)
  travel_time_to_next?: string; // 다음 장소까지의 이동 시간
  time_block?: string;         // 예: "1일차 오전"
}

export interface ItineraryDayWithTime {
  day: number;
  places: ItineraryPlaceWithTime[];
  totalDistance: number;
}

export interface RestaurantInformation {
  id: number;
  place_name?: string;
  road_address?: string;
  lot_address?: string;
  longitude?: number;
  latitude?: number;
}

export interface RestaurantLink {
  id: number;
  link?: string;
  instagram?: string;
}

export interface RestaurantCategory {
  id: number;
  Categories?: string;
  Categories_Details?: string;
}

export interface RestaurantRating {
  id: number;
  rating?: number;
  visitor_review_count?: number;
}

export interface RestaurantOpeningHours {
  Id: number;
  [key: string]: any; // 요일_시간대 형태의 키(Mon_09, Mon_10 등)
}

export interface RestaurantNotes {
  id: number;
  Note?: string;
}

// Cafe interfaces
export interface CafeInformation {
  id: number;
  place_name?: string;
  road_address?: string;
  lot_address?: string;
  longitude?: number;
  latitude?: number;
}

export interface CafeLink {
  id: number;
  link?: string;
  instagram?: string;
}

export interface CafeCategory {
  id: number;
  categories?: string;
  categories_details?: string;
}

export interface CafeRating {
  id: number;
  rating?: number;
  visitor_review_count?: number;
}

// accomodation with one 'c' (철자 주의)
export interface AccommodationInformation {
  id: number;
  place_name?: string;
  road_address?: string;
  lot_address?: string;
  longitude?: number;
  latitude?: number;
}

export interface AccommodationLink {
  ID: number;
  link?: string;
  instagram?: string;
}

export interface AccommodationRating {
  id: number; 
  rating?: number;
  visitor_review_count?: number;
}

export interface AccommodationCategory {
  id: number;
  Categories?: string;
  Categories_Details?: string;
}

// 관광지(landmark) 정보를 위한 인터페이스 추가
export interface LandmarkInformation {
  id: number;
  place_name?: string;
  road_address?: string;
  lot_address?: string;
  longitude?: number;
  latitude?: number;
}

export interface LandmarkLink {
  id: number;
  link?: string;
  instagram?: string;
}

export interface LandmarkRating {
  id: number;
  rating?: number;
  visitor_review_count?: number;
}

export interface LandmarkCategory {
  id: number;
  categories?: string;
  Categories_Details?: string;
}

// 일정 생성을 위한 페이로드 타입 추가
export interface SchedulePayload {
  selected_places: SelectedPlace[];
  candidate_places: SelectedPlace[];
  start_datetime: string;
  end_datetime: string;
}

// Modified SelectedPlace interface to ensure id is number
export interface SelectedPlace {
  id: number;
  name: string;
}

// Naver Maps type definitions
declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}
