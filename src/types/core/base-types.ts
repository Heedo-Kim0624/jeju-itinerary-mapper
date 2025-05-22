
/**
 * Base types used throughout the application.
 */

// Represents a geographic coordinate.
export interface Coordinate {
  x: number; // Longitude
  y: number; // Latitude
}

// 카테고리 이름 타입 정의
export type CategoryName = 
  | '음식점'
  | '관광지'
  | '카페'
  | '숙소'
  | '교통'
  | '기타';

// 서버에 전송하는 장소 정보
export interface SchedulePlace {
  id: string | number;
  name: string;
}

// Represents a generic place.
export interface Place extends Coordinate {
  id: string | number; // Changed to string | number
  name: string;
  category: string; // e.g., 'restaurant', 'attraction', 'cafe', 'accommodation'
  address: string;
  road_address: string;
  phone: string;
  description: string;
  rating: number;
  image_url: string;
  homepage: string;
  
  // Optional fields
  reviewCount?: number;
  operationTimeData?: { [key: string]: number }; // e.g. { "Mon_0900": 1 (open), "Mon_1000": 0 (closed)}
  weight?: number; // For ranking or scoring
  raw?: any; // Raw data from source if needed
  categoryDetail?: string; // More specific category, e.g. "Korean BBQ"
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string; // Formatted operating hours string
  geoNodeId?: string; // ID of the corresponding node in GeoJSON data (if applicable)
  geoNodeDistance?: number; // Distance to nearest GeoJSON node
  isSelected?: boolean; // 선택된 장소 여부
  isCandidate?: boolean; // 후보 장소 여부
}

// Represents a place that has been selected by the user, possibly with additional state.
export interface SelectedPlace extends Place {
  id: string | number; // Changed to string | number and ensured it's present
  isSelected?: boolean; // Explicitly for selected places in a list
  isCandidate?: boolean; // If the place is a candidate (e.g. for itinerary)
}

// Type for storing category keywords and their weights
export interface CategoryKeywordWeight {
  category: string; // Main category name (e.g., "음식점")
  keywords: Array<{ keyword: string; weight: number }>;
}
