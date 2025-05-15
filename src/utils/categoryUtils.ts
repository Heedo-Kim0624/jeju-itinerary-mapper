// Add the getCategoryKorean function if it doesn't exist
export const getCategoryKorean = (categoryName: string): string => {
  const categoryMap: Record<string, string> = {
    'accommodation': '숙소',
    'landmark': '관광지',
    'restaurant': '음식점',
    'cafe': '카페',
    'attraction': '관광지', // Common alias for landmark
    // Add any other categories as needed
  };
  
  return categoryMap[categoryName.toLowerCase()] || categoryName;
};

// Define CategoryName and CategoryKeywords
export type CategoryName = 'accommodation' | 'landmark' | 'restaurant' | 'cafe' | 'attraction';

export type CategoryKeywords = Record<CategoryName, string[]>;

// Existing mapCategoryNameToKey can be useful too
export const mapCategoryNameToKey = (koreanName: string): CategoryName => {
  const map: Record<string, CategoryName> = {
    '숙소': 'accommodation',
    '관광지': 'landmark', // or 'attraction'
    '음식점': 'restaurant',
    '카페': 'cafe',
  };
  return map[koreanName] || 'landmark'; // Default or handle error
};
