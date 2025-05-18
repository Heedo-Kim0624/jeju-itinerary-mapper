
export type CategoryName = 'accommodation' | 'attraction' | 'restaurant' | 'cafe';

// 카테고리 별 키워드 타입 정의 추가
export type CategoryKeywords = {
  'accommodation': string[];
  'attraction': string[];
  'restaurant': string[];
  'cafe': string[];
};

export const categoryKeywords: CategoryKeywords = {
  'accommodation': ['ocean_view', 'breakfast', 'pool'],
  'attraction': ['nature', 'culture', 'history'],
  'restaurant': ['seafood', 'korean', 'vegetarian'],
  'cafe': ['coffee', 'cake', 'view']
};

// Maps Korean display names to English CategoryName
export const koreanToEnglishCategoryName = (koreanName: string): CategoryName | null => {
  switch (koreanName) {
    case '숙소': return 'accommodation';
    case '관광지': return 'attraction';
    case '음식점': return 'restaurant';
    case '카페': return 'cafe';
    default: return null;
  }
};

// Maps English CategoryName to Korean display names
export const englishCategoryNameToKorean = (englishName: CategoryName): string => {
  const mapping: Record<CategoryName, string> = {
    'accommodation': '숙소',
    'attraction': '관광지',
    'restaurant': '음식점',
    'cafe': '카페'
  };
  return mapping[englishName] || englishName; // Fallback to English name if not found
};

// Kept for potential compatibility, but new functions above are preferred for clarity
export const categoryToEnglish = (koreanName: string): string => {
  const map: Record<string, string> = {
    '숙소': 'accommodation',
    '관광지': 'attraction',
    '음식점': 'restaurant',
    '카페': 'cafe'
  };
  return map[koreanName] || koreanName; // Fallback if not a direct Korean CategoryName
};

export const englishToKorean = (englishName: string): string => {
  const map: Record<string, string> = {
    'accommodation': '숙소',
    'attraction': '관광지',
    'restaurant': '음식점',
    'cafe': '카페'
  };
  // If englishName is already a CategoryName, map it. Otherwise, it might be a generic string.
  return map[englishName as CategoryName] || englishName;
};


export const CATEGORIES: CategoryName[] = ['accommodation', 'attraction', 'restaurant', 'cafe'];

// 카테고리별 최소 추천 개수 계산 함수
export const getMinimumRecommendationsByCategory = (days: number): Record<CategoryName, number> => {
  return {
    'accommodation': days > 1 ? days - 1 : 1,
    'attraction': Math.max(4, Math.ceil(4 * days)),
    'restaurant': Math.max(3, Math.ceil(3 * days)),
    'cafe': Math.max(3, Math.ceil(3 * days))
  };
};

// Export with alias for backwards compatibility
export const MINIMUM_RECOMMENDATION_COUNT = getMinimumRecommendationsByCategory;

// 카테고리별 시간대 추천 가중치
export const timeOfDayWeights: Record<CategoryName, { morning: number; afternoon: number; evening: number; night: number }> = {
  'accommodation': {
    morning: 0.2,
    afternoon: 0.3,
    evening: 1.0,
    night: 0.8
  },
  'attraction': {
    morning: 1.0,
    afternoon: 0.9,
    evening: 0.5,
    night: 0.2
  },
  'restaurant': {
    morning: 0.7,
    afternoon: 0.3,
    evening: 1.0,
    night: 0.6
  },
  'cafe': {
    morning: 0.8,
    afternoon: 1.0,
    evening: 0.8,
    night: 0.4
  }
};
