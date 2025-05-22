
import type { CategoryName, Place } from '@/types/core';

// This interface consolidates all information for a place
export interface DetailedPlace {
  // Core Place fields (can also extend Place from '@/types/core')
  id: number; // Numeric ID is crucial for Map keys
  name: string;
  address: string;
  road_address?: string;
  phone?: string;
  category: CategoryName;
  description?: string;
  x: number; // longitude
  y: number; // latitude
  image_url?: string;
  homepage?: string;
  geoNodeId?: string; // If used for map linking

  // Fields from _rating table
  rating?: number;
  visitor_review_count?: number;

  // Fields from _categories table
  categories_details?: string; // e.g., "한식 > 한정식", "숙박 > 호텔 > 특급호텔"

  // Fields from _link table
  link_url?: string; // e.g., Naver Map link
  instagram_url?: string;

  // Fields from _review table (if applicable and fetched)
  // visitor_norm?: number;

  // Original type from server if needed for distinction
  original_place_type?: string; // e.g., 'accommodation', 'landmark'
}

// Represents the raw data structure from Supabase tables before merging
export interface RawPlaceInfo {
  id: string | number;
  place_name?: string;
  name?: string; // Sometimes 'name' is used instead of 'place_name'
  road_address?: string;
  lot_address?: string; // Fallback for address
  address?: string; // General address field
  phone?: string;
  category?: string; // Raw category string from DB
  description?: string;
  longitude?: number;
  latitude?: number;
  image_url?: string;
  homepage_url?: string; // Sometimes with _url suffix
  homepage?: string;
  [key: string]: any; // Allow other properties
}

export interface RawPlaceRating {
  id: string | number;
  rating?: number;
  visitor_review_count?: number;
  [key: string]: any;
}

export interface RawPlaceLink {
  id: string | number;
  link?: string;
  instagram?: string;
  [key: string]: any;
}

export interface RawPlaceCategoryDetail {
  id: string | number;
  categories_details?: string; // As in DB
  Categories_Details?: string; // Alternate casing observed
  [key: string]: any;
}

export type PlaceTableType = 'accommodation' | 'landmark' | 'restaurant' | 'cafe';

