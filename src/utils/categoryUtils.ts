
export type CategoryName = 'accommodation' | 'touristSpot' | 'restaurant' | 'cafe';

// 카테고리 별 키워드 타입 정의 추가
export type CategoryKeywords = {
  'accommodation': string[];
  'touristSpot': string[];
  'restaurant': string[];
  'cafe': string[];
};

export const categoryKeywords = {
  'accommodation': ['ocean_view', 'breakfast', 'pool'],
  'touristSpot': ['nature', 'culture', 'history'],
  'restaurant': ['seafood', 'korean', 'vegetarian'],
  'cafe': ['coffee', 'cake', 'view']
};

export const categoryToEnglish = (koreanName: string): CategoryName | null => {
  const mapping: Record<string, CategoryName> = {
    '숙소': 'accommodation',
    '관광지': 'touristSpot',
    '음식점': 'restaurant',
    '카페': 'cafe'
  };
  
  return mapping[koreanName] || null;
};

export const englishToKorean = (englishName: string): string | null => {
  switch(englishName.toLowerCase()) {
    case 'accommodation': return '숙소';
    case 'touristspot': return '관광지';
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    default: return null;
  }
};

// Add missing constants
export const CATEGORIES: string[] = ['숙소', '관광지', '음식점', '카페'];
export const CATEGORY_NAMES: CategoryName[] = ['accommodation', 'touristSpot', 'restaurant', 'cafe'];

// 카테고리별 최소 추천 개수 계산 함수
export const getMinimumRecommendationsByCategory = (days: number) => {
  return {
    'accommodation': days > 1 ? days - 1 : 1,
    'touristSpot': Math.max(4, Math.ceil(4 * days)),
    'restaurant': Math.max(3, Math.ceil(3 * days)),
    'cafe': Math.max(3, Math.ceil(3 * days))
  };
};

// Export with alias for backwards compatibility
export const MINIMUM_RECOMMENDATION_COUNT = getMinimumRecommendationsByCategory;

// 카테고리별 시간대 추천 가중치
export const timeOfDayWeights = {
  'accommodation': {
    morning: 0.2,
    afternoon: 0.3,  
    evening: 1.0,
    night: 0.8
  },
  'touristSpot': {
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
