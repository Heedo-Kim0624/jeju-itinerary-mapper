
import type { Place, SelectedPlace, CategoryName } from '@/types/core';
import { englishToKorean } from '@/utils/categoryUtils'; // englishToKorean 임포트

const VALID_CATEGORY_NAMES: ReadonlyArray<CategoryName> = ['숙소', '관광지', '음식점', '카페'];

/**
 * 주어진 문자열이 유효한 CategoryName인지 확인합니다.
 */
export function isValidCategoryName(category: string): category is CategoryName {
  return VALID_CATEGORY_NAMES.includes(category as CategoryName);
}

/**
 * 문자열 카테고리를 CategoryName 타입으로 변환합니다.
 * 영문 카테고리명도 처리하며, 유효하지 않은 경우 기본값을 반환하고 경고를 로깅합니다.
 */
export function toCategoryName(category: string, defaultCategory: CategoryName = '관광지'): CategoryName {
  if (isValidCategoryName(category)) { // 입력값이 이미 유효한 한글 카테고리명인지 확인
    return category;
  }

  // 한글 카테고리명이 아니라면, 영문인지 확인하고 변환 시도
  const koreanFromEnglish = englishToKorean(category);
  if (koreanFromEnglish) {
    return koreanFromEnglish;
  }
  
  // 유효한 한글도 아니고, 알려진 영문도 아니라면 경고 후 기본값 사용
  // 단, '기타'와 같은 특정 문자열을 VALID_CATEGORY_NAMES에 포함시키지 않고
  // 특별히 처리하고 싶다면 이 부분의 로직을 조정할 수 있습니다.
  // 예를 들어, '기타'를 항상 '관광지'로 변환하고 싶다면 여기서 처리 가능합니다.
  if (category.toLowerCase() !== '기타') { // '기타' 자체에 대한 경고는 피할 수 있도록 조건 추가 가능
    console.warn(`[toCategoryName] 유효하지 않은 카테고리 값 "${category}"이(가) 감지되었습니다. 기본값 "${defaultCategory}"(으)로 처리됩니다.`);
  }
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

