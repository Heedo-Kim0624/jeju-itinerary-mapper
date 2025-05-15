
// 카테고리 관련 유틸리티 함수 및 상수

// 카테고리 이름 타입 정의
export type CategoryName = '숙소' | '관광지' | '음식점' | '카페' | 'accommodation' | 'attraction' | 'restaurant' | 'cafe' | 'landmark';

// 영문-한글 카테고리 매핑
export const CATEGORY_ENG_TO_KOR: Record<string, string> = {
  'accommodation': '숙소',
  'attraction': '관광지',
  'landmark': '관광지',
  'restaurant': '음식점',
  'cafe': '카페'
};

// 한글-영문 카테고리 매핑
export const CATEGORY_KOR_TO_ENG: Record<string, string> = {
  '숙소': 'accommodation',
  '관광지': 'attraction',
  '음식점': 'restaurant',
  '카페': 'cafe'
};

// 카테고리 아이콘 매핑
export const CATEGORY_ICONS: Record<string, string> = {
  '숙소': '🏠',
  'accommodation': '🏠',
  '관광지': '🏞️',
  'attraction': '🏞️',
  'landmark': '🏞️', 
  '음식점': '🍽️',
  'restaurant': '🍽️',
  '카페': '☕',
  'cafe': '☕'
};

// 카테고리 색상 매핑
export const CATEGORY_COLORS: Record<string, string> = {
  '숙소': '#4CAF50',   // 녹색
  'accommodation': '#4CAF50',
  '관광지': '#2196F3',  // 파란색
  'attraction': '#2196F3',
  'landmark': '#2196F3',
  '음식점': '#FF5722',  // 주황색
  'restaurant': '#FF5722',
  '카페': '#9C27B0',   // 보라색
  'cafe': '#9C27B0'
};

// 카테고리 이름 변환 함수 (영문 -> 한글)
export const getCategoryKorean = (category?: string): string => {
  if (!category) return '기타';
  
  const normalizedCategory = category.toLowerCase();
  return CATEGORY_ENG_TO_KOR[normalizedCategory] || '기타';
};

// 카테고리 이름 변환 함수 (한글 -> 영문)
export const getCategoryEnglish = (category?: string): string => {
  if (!category) return 'etc';
  
  return CATEGORY_KOR_TO_ENG[category] || 'etc';
};

// 카테고리별 최소 추천 개수 계산 함수
export const getMinimumRecommendationCount = (nDays: number) => {
  return {
    attraction: Math.ceil(nDays * 4),   // 관광지: 하루 4개
    restaurant: Math.ceil(nDays * 3),   // 음식점: 하루 3개
    cafe: Math.ceil(nDays * 3),         // 카페: 하루 3개
    accommodation: Math.min(nDays, 3)   // 숙소: 여행일수와 3 중 작은 값
  };
};

// 카테고리 관련 인터페이스
export interface CategoryKeywords {
  restaurant: string[];
  cafe: string[];
  attraction: string[];
  accommodation: string[];
  landmark: string[];
}

// 카테고리 정보 인터페이스
export interface CategoryInfo {
  name: CategoryName;
  icon: string;
  color: string;
  description: string;
  isCompleted: boolean;
}
