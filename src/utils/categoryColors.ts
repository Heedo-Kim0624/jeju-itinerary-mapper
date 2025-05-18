
import { CategoryName } from "./categoryUtils"; // Import English CategoryName

type CategoryColorInfo = {
  bg: string;
  text: string;
  marker: string;
};

// Keys are English CategoryName literals or general strings that match them.
export const categoryColors: Record<CategoryName | string, CategoryColorInfo> = {
  restaurant: {
    bg: 'bg-jeju-orange',
    text: 'text-white',
    marker: '#FF5252', // 빨강 - 음식점
  },
  cafe: {
    bg: 'bg-jeju-green',
    text: 'text-white',
    marker: '#9C27B0', // 보라 - 카페
  },
  attraction: {
    bg: 'bg-jeju-blue',
    text: 'text-white',
    marker: '#4CAF50', // 초록 - 관광지
  },
  accommodation: {
    bg: 'bg-purple-500', // Using a generic purple, replace if specific Jeju purple exists
    text: 'text-white',
    marker: '#2196F3', // 파랑 - 숙소
  },
  // Default or other categories if any
  default: {
    bg: 'bg-gray-500',
    text: 'text-white',
    marker: '#1F1F1F',
  }
};

// Takes English CategoryName or any string, returns Korean display name.
export const getCategoryDisplayName = (categoryKey: CategoryName | string): string => {
  switch (categoryKey) {
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    case 'attraction': return '관광지';
    case 'accommodation': return '숙소';
    default: return categoryKey; // Return original key if no mapping found
  }
};

// Takes Korean display name, returns English CategoryName key or a fallback.
export const mapKoreanNameToEnglishKey = (koreanName: string): CategoryName | string => {
  switch (koreanName) {
    case '음식점': return 'restaurant';
    case '카페': return 'cafe';
    case '관광지': return 'attraction';
    case '숙소': return 'accommodation';
    default: return koreanName; // Fallback
  }
};

// Get marker color, expects English CategoryName or a matching string key.
export const getCategoryColor = (categoryKey: CategoryName | string): string => {
  return categoryColors[categoryKey]?.marker || categoryColors.default.marker;
};
