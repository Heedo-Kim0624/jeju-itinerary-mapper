import { PlaceType } from "./travel";

export interface Place {
  id: string | number;
  name: string;
  x: number;
  y: number;
  address: string;
  phone: string;
  description: string;
  rating: number;
  image_url: string;
  road_address: string;
  homepage: string;
  category?: CategoryName;
  geoNodeId?: string;
}

export type CategoryName = typeof CATEGORIES[number];

export const toCategoryName = (category: string): CategoryName => {
  if (CATEGORIES.includes(category as CategoryName)) {
    return category as CategoryName;
  }
  console.warn(`Unknown category: ${category}`);
  return 'landmark'; // 기본 카테고리
};

export const toCategoryNameKorean = (category: CategoryName): string => {
  switch (category) {
    case 'accommodation':
      return '숙소';
    case 'landmark':
      return '관광지';
    case 'restaurant':
      return '음식점';
    case 'cafe':
      return '카페';
    default:
      return '기타';
  }
};

export interface SelectedPlace extends Place {
  isSelected: boolean;
  isCandidate: boolean;
}

export const CATEGORIES = ['accommodation', 'landmark', 'restaurant', 'cafe'] as const;

export const MINIMUM_RECOMMENDATION_COUNT = (nDays: number) => ({
  accommodation: 1,
  landmark: 4 * nDays,
  restaurant: 3 * nDays,
  cafe: 3 * nDays,
});
