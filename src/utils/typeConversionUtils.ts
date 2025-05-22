
import type { Place, SelectedPlace, CategoryName } from '@/types/core';

const VALID_CATEGORY_NAMES: ReadonlyArray<CategoryName> = ['숙소', '관광지', '음식점', '카페'];

/**
 * 주어진 문자열이 유효한 CategoryName인지 확인합니다.
 */
export function isValidCategoryName(category: string): category is CategoryName {
  return VALID_CATEGORY_NAMES.includes(category as CategoryName);
}

/**
 * 문자열 카테고리를 CategoryName 타입으로 변환합니다.
 * 유효하지 않은 경우 기본값을 반환하고 경고를 로깅합니다.
 */
export function toCategoryName(category: string, defaultCategory: CategoryName = '관광지'): CategoryName {
  if (isValidCategoryName(category)) {
    return category;
  }
  console.warn(`[toCategoryName] 유효하지 않은 카테고리 값 "${category}"이(가) 감지되었습니다. 기본값 "${defaultCategory}"(으)로 처리됩니다.`);
  return defaultCategory;
}

/**
 * Place 객체를 SelectedPlace 객체로 변환합니다.
 * category 필드를 CategoryName 타입으로 변환합니다.
 */
export function convertPlaceToSelectedPlace(place: Place): SelectedPlace {
  return {
    ...place,
    category: toCategoryName(place.category), // Ensure category is CategoryName
    isSelected: place.isSelected || false,
    isCandidate: place.isCandidate || false,
  };
}

/**
 * Place 객체 배열을 SelectedPlace 객체 배열로 변환합니다.
 */
export function convertPlacesToSelectedPlaces(places: Place[]): SelectedPlace[] {
  return places.map(convertPlaceToSelectedPlace);
}

