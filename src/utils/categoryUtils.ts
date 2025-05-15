
// Category names used throughout the application
export type CategoryName = '숙소' | '관광지' | '음식점' | '카페';

export const CATEGORY_MAPPING: Record<string, string> = {
  'accommodation': '숙소',
  'attraction': '관광지',
  'restaurant': '음식점',
  'cafe': '카페'
};

export const CATEGORY_ENGLISH_MAPPING: Record<string, string> = {
  '숙소': 'accommodation',
  '관광지': 'attraction',
  '음식점': 'restaurant',
  '카페': 'cafe'
};

export const getCategoryName = (category?: string): CategoryName | string => {
  if (!category) return '기타';
  
  const lowerCategory = category.toLowerCase();
  
  if (lowerCategory === 'accommodation') return '숙소';
  if (lowerCategory === 'attraction') return '관광지';
  if (lowerCategory === 'restaurant') return '음식점';
  if (lowerCategory === 'cafe') return '카페';
  
  return '기타';
};

export const getEnglishCategoryName = (category?: string): string => {
  if (!category) return 'other';
  
  const koreanName = category as CategoryName;
  return CATEGORY_ENGLISH_MAPPING[koreanName] || 'other';
};

export const getCategoryColor = (category?: string): string => {
  if (!category) return '#999999';
  
  const categoryName = getCategoryName(category);
  
  switch (categoryName) {
    case '숙소': return '#4A6CC3';
    case '관광지': return '#2E8B57';
    case '음식점': return '#C13584';
    case '카페': return '#BE7D3F';
    default: return '#999999';
  }
};
