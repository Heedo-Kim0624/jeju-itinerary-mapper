
type CategoryKey = 'accommodation' | 'landmark' | 'restaurant' | 'cafe' | 'attraction';

/**
 * 카테고리 영문명을 한글로 변환하는 유틸리티 함수
 * @param category 카테고리 영문명
 * @returns 카테고리 한글명
 */
export const getCategoryKorean = (category?: string): string => {
  if (!category) return '기타';
  
  switch (category.toLowerCase()) {
    case 'accommodation':
      return '숙소';
    case 'attraction':
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

/**
 * 카테고리별 아이콘 이름을 반환하는 유틸리티 함수
 * @param category 카테고리 이름
 * @returns 아이콘 이름
 */
export const getCategoryIcon = (category?: string): string => {
  if (!category) return 'map-pin';
  
  switch (category.toLowerCase()) {
    case 'accommodation':
      return 'bed';
    case 'attraction':
    case 'landmark':
      return 'mountain-snow';
    case 'restaurant':
      return 'utensils';
    case 'cafe':
      return 'coffee';
    default:
      return 'map-pin';
  }
};

/**
 * 카테고리별 색상을 반환하는 유틸리티 함수
 * @param category 카테고리 이름
 * @returns 색상 코드
 */
export const getCategoryColor = (category?: string): string => {
  if (!category) return '#6B7280'; // gray-500
  
  switch (category.toLowerCase()) {
    case 'accommodation':
      return '#EC4899'; // pink-500
    case 'attraction':
    case 'landmark':
      return '#10B981'; // emerald-500
    case 'restaurant':
      return '#F59E0B'; // amber-500
    case 'cafe':
      return '#8B5CF6'; // violet-500
    default:
      return '#6B7280'; // gray-500
  }
};

export const categoryEmojis: Record<string, string> = {
  'accommodation': '🏨',
  'landmark': '🏞️',
  'attraction': '🏞️',
  'restaurant': '🍽️',
  'cafe': '☕',
  'default': '📍'
};

export const getCategoryEmoji = (category?: string): string => {
  if (!category) return categoryEmojis.default;
  return categoryEmojis[category.toLowerCase()] || categoryEmojis.default;
};
