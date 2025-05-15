
import { toast } from "sonner";

// 카테고리 이름 타입 정의
export type CategoryName = '숙소' | '관광지' | '음식점' | '카페';

// 카테고리 코드-이름 매핑
export const CATEGORY_NAME_MAP: Record<string, CategoryName> = {
  'accommodation': '숙소',
  'attraction': '관광지', 
  'restaurant': '음식점',
  'cafe': '카페'
};

// 영문 카테고리 코드 변환
export const CATEGORY_CODE_MAP: Record<CategoryName, string> = {
  '숙소': 'accommodation',
  '관광지': 'attraction',
  '음식점': 'restaurant',
  '카페': 'cafe'
};

// 카테고리별 최소 추천 수
export const getMinimumRecommendations = (days: number) => ({
  'attraction': Math.max(1, 4 * days),
  'restaurant': Math.max(1, 3 * days),
  'cafe': Math.max(1, 3 * days),
  'accommodation': 1
});

// 카테고리 유효성 검사
export const isCategoryNameValid = (category: string): category is CategoryName => {
  return Object.values(CATEGORY_NAME_MAP).includes(category as CategoryName);
};

// 카테고리 한글명으로 영문 코드 가져오기
export const getCategoryCode = (categoryName: string): string => {
  if (isCategoryNameValid(categoryName)) {
    return CATEGORY_CODE_MAP[categoryName];
  }
  console.warn(`알 수 없는 카테고리 이름: ${categoryName}`);
  return 'unknown';
};

// 카테고리 영문 코드로 한글명 가져오기
export const getCategoryName = (categoryCode: string): CategoryName | '기타' => {
  return CATEGORY_NAME_MAP[categoryCode?.toLowerCase()] || '기타';
};

// 카테고리 방문 순서 계산 유틸리티
export function calculateCategoryVisitOrder(days: number): Record<string, number> {
  return {
    'attraction': Math.ceil(4 / days),
    'restaurant': Math.ceil(3 / days),
    'cafe': Math.ceil(3 / days),
    'accommodation': 1
  };
}
