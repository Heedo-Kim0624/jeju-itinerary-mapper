// Add the getCategoryKorean function if it doesn't exist
export const getCategoryKorean = (categoryName: string): string => {
  const categoryMap: Record<string, string> = {
    'accommodation': '숙소',
    'landmark': '관광지',
    'restaurant': '음식점',
    'cafe': '카페',
    // Add any other categories as needed
  };
  
  return categoryMap[categoryName] || categoryName;
};
