
/**
 * Base type definitions for the application
 */

// CategoryName type 
export type CategoryName = '숙소' | '관광지' | '음식점' | '카페';

// Basic place interface
export interface Place {
  id: string; // Ensure id is string
  name: string;
  address: string;
  phone: string;
  category: string; // This can be CategoryName or a more general string if places can have other categories
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
  categoryDetail?: string;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
  operatingHours?: string;
}

// Selected place interface
export interface SelectedPlace extends Place {
  id: string; // Ensure id is string
  category: CategoryName; // Use the unified CategoryName
  isSelected: boolean;
  isCandidate: boolean;
}

// Schedule place interface (simplified place data for API requests)
export interface SchedulePlace {
  id: string | number; // This can remain as server might send numbers
  name: string;
}

// Trip date and time interface
export interface TripDateTime {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}
