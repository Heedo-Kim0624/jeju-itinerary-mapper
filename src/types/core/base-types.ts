/**
 * Base type definitions for the application
 */

// CategoryName type 
export type CategoryName = '숙소' | '관광지' | '음식점' | '카페' | '교통';

// PlaceId type 
export type PlaceId = string;

// PlaceName type 
export type PlaceName = string;

// Coordinate type 
export type Coordinate = {
  x: number;
  y: number;
};

// PhotoUrl type 
export type PhotoUrl = string;

// Basic place interface
export interface Place {
  id: PlaceId;
  name: PlaceName;
  address: string;
  phone: string;
  category: string;
  description: string;
  rating: number;
  x: number;
  y: number;
  image_url: PhotoUrl;
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

// Selected place interface
export interface SelectedPlace extends Place {
  category: CategoryName;
  isSelected: boolean;
  isCandidate: boolean;
}

// Schedule place interface (simplified place data for API requests)
export interface SchedulePlace {
  id: number | string;
  name: string;
}

// Trip date and time interface
export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}
