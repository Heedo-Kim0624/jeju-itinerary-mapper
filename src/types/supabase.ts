// src/types/supabase.ts
export interface Place {
  id: string;
  name: string;
  address: string;
  category: string;
  categoryDetail?: string;
  x: number;
  y: number;
  naverLink: string;
  instaLink: string;
  rating?: number;
  reviewCount?: number;
  operatingHours?: string;
  operationTimeData?: {
    [key: string]: number;
  };
  nodeId?: string;
}

export interface ItineraryDay {
  day: number;
  places: Place[];
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

// Place interface for normalized data - updated to make operatingHours optional

// Naver Maps 타입 정의
declare global {
  interface Window {
    naver: any;
    navermap_authFailure?: () => void;
  }
}
