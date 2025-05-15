
import { Place } from '@/types/supabase';

export type CategoryName = '숙소' | '관광지' | '음식점' | '카페' | '기타';

/**
 * Converts an English category to its Korean equivalent
 */
export const getCategoryKorean = (category?: string): CategoryName => {
  if (!category) return '기타';
  
  switch (category.toLowerCase()) {
    case 'accommodation': return '숙소';
    case 'attraction': return '관광지';
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    default: return '기타';
  }
};

/**
 * Groups places by their category
 */
export const groupPlacesByCategory = (places: Place[]): Record<CategoryName, Place[]> => {
  const result: Record<CategoryName, Place[]> = {
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
    '기타': []
  };
  
  places.forEach(place => {
    const category = getCategoryKorean(place.category);
    result[category].push(place);
  });
  
  return result;
};

/**
 * Checks if all required categories have at least one place selected
 */
export const areAllCategoriesSelected = (categoryGroups: Record<CategoryName, Place[]>): boolean => {
  return (
    categoryGroups['숙소'].length > 0 && 
    categoryGroups['관광지'].length > 0 && 
    categoryGroups['음식점'].length > 0 && 
    categoryGroups['카페'].length > 0
  );
};
