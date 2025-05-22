
import type { CategoryName as CoreCategoryName } from '@/types/core/base-types';

// Re-export CategoryName from core types to ensure consistency
export type CategoryName = CoreCategoryName;

// 카테고리 별 키워드 타입 정의 추가
export type CategoryKeywords = {
  '숙소': string[];
  '관광지': string[];
  '음식점': string[];
  '카페': string[];
  // "교통" 및 "기타" 카테고리도 포함될 수 있으므로, 더 유연하게 정의하거나
  // CoreCategoryName에 있는 모든 키를 포함하도록 수정 필요.
  // 여기서는 기존 구조를 최대한 유지하되, CategoryName은 core 것을 따름.
  [key: string]: string[]; // Allow other categories from CoreCategoryName
};

export const categoryKeywords: CategoryKeywords = {
  '숙소': ['ocean_view', 'breakfast', 'pool'],
  '관광지': ['nature', 'culture', 'history'],
  '음식점': ['seafood', 'korean', 'vegetarian'],
  '카페': ['coffee', 'cake', 'view'],
  '교통': [], // Add if specific keywords are needed
  '기타': [], // Add if specific keywords are needed
};

export const categoryToEnglish = (koreanName: CategoryName): string => {
  const mapping: Partial<Record<CategoryName, string>> = { // Partial to handle all CoreCategoryName values
    '숙소': 'accommodation',
    '관광지': 'attraction',
    '음식점': 'restaurant',
    '카페': 'cafe',
    '교통': 'transportation',
    '기타': 'other',
  };
  
  return mapping[koreanName] || 'other';
};

export const englishToKorean = (englishName: string): CategoryName | null => {
  switch(englishName.toLowerCase()) {
    case 'accommodation': return '숙소';
    case 'attraction': return '관광지';
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    case 'transportation': return '교통';
    case 'other': return '기타';
    default: return null;
  }
};

// CATEGORIES 배열도 CoreCategoryName을 기반으로 업데이트하거나,
// CoreCategoryName 자체를 사용하는 것을 고려.
// 여기서는 기존 CATEGORIES 정의를 유지하되, CategoryName 타입은 core 것을 따름.
export const CATEGORIES: CategoryName[] = ['숙소', '관광지', '음식점', '카페', '교통', '기타'];


// 카테고리별 최소 추천 개수 계산 함수
export const getMinimumRecommendationsByCategory = (days: number): Record<string, number> => {
  // This function might need to handle all CoreCategoryName values if it's used generically
  return {
    '숙소': days > 1 ? days - 1 : 1,
    '관광지': Math.max(4, Math.ceil(4 * days)),
    '음식점': Math.max(3, Math.ceil(3 * days)),
    '카페': Math.max(3, Math.ceil(3 * days)),
    '교통': 1, // Example for new categories
    '기타': 1, // Example for new categories
  };
};

// Export with alias for backwards compatibility
export const MINIMUM_RECOMMENDATION_COUNT = getMinimumRecommendationsByCategory;

// 카테고리별 시간대 추천 가중치
export const timeOfDayWeights: Record<string, Record<string, number>> = {
  // This also might need to handle all CoreCategoryName values
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
  },
  '교통': { // Example for new categories
    morning: 0.5, afternoon: 0.5, evening: 0.5, night: 0.5
  },
  '기타': { // Example for new categories
    morning: 0.5, afternoon: 0.5, evening: 0.5, night: 0.5
  }
};

