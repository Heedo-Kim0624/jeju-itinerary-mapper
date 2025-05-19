
import { CategoryName, CategoryNameKorean, CATEGORY_MAPPING, CATEGORY_MAPPING_REVERSE, toCategoryName, toCategoryNameKorean } from '@/types';

// Removed: export type CategoryName = '숙소' | '관광지' | '음식점' | '카페';

// 카테고리 별 키워드 타입 정의 추가 - 키를 CategoryNameKorean으로 명시
export type CategoryKeywords = Record<CategoryNameKorean, string[]>;

export const categoryKeywords: CategoryKeywords = {
  '숙소': ['ocean_view', 'breakfast', 'pool'],
  '관광지': ['nature', 'culture', 'history'],
  '음식점': ['seafood', 'korean', 'vegetarian'],
  '카페': ['coffee', 'cake', 'view']
};

// 이제 @/types에 있는 CATEGORY_MAPPING 또는 toCategoryNameKorean 사용
export const categoryToEnglish = (koreanName: CategoryNameKorean): CategoryName => {
  return CATEGORY_MAPPING_REVERSE[koreanName] || 'landmark'; // Default or error handling
};

// 이제 @/types에 있는 CATEGORY_MAPPING_REVERSE 또는 toCategoryName 사용
export const englishToKorean = (englishName: CategoryName): CategoryNameKorean => {
  return CATEGORY_MAPPING[englishName] || '관광지'; // Default or error handling
};

// CATEGORIES는 이제 CategoryNameKorean 타입을 사용합니다.
export const CATEGORIES: CategoryNameKorean[] = ['숙소', '관광지', '음식점', '카페'];

// 카테고리별 최소 추천 개수 계산 함수 - 키를 CategoryNameKorean으로 명시
export const getMinimumRecommendationsByCategory = (days: number): Record<CategoryNameKorean, number> => {
  return {
    '숙소': days > 1 ? days - 1 : 1,
    '관광지': Math.max(4, Math.ceil(4 * days)),
    '음식점': Math.max(3, Math.ceil(3 * days)),
    '카페': Math.max(3, Math.ceil(3 * days))
  };
};

// Export with alias for backwards compatibility
export const MINIMUM_RECOMMENDATION_COUNT = getMinimumRecommendationsByCategory;

// 카테고리별 시간대 추천 가중치 - 키를 CategoryNameKorean으로 명시
export const timeOfDayWeights: Record<CategoryNameKorean, { morning: number, afternoon: number, evening: number, night: number }> = {
  '숙소': {
    morning: 0.2,
    afternoon: 0.3,
    evening: 1.0,
    night: 0.8
  },
  '관광지': {
    morning: 1.0,
    afternoon: 0.9,
    evening: 0.5,
    night: 0.2
  },
  '음식점': {
    morning: 0.7,
    afternoon: 0.3,
    evening: 1.0,
    night: 0.6
  },
  '카페': {
    morning: 0.8,
    afternoon: 1.0,
    evening: 0.8,
    night: 0.4
  }
};
