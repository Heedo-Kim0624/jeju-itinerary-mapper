
type CategoryColors = {
  [key: string]: {
    bg: string; // Background color
    text: string; // Text color
    marker: string; // Marker color
  };
};

export const categoryColors: CategoryColors = {
  restaurant: {
    bg: 'bg-jeju-orange',
    text: 'text-white',
    marker: '#FF8C3E',
  },
  cafe: {
    bg: 'bg-jeju-green',
    text: 'text-white',
    marker: '#6CCEA0',
  },
  attraction: {
    bg: 'bg-jeju-blue',
    text: 'text-white',
    marker: '#5EAEFF',
  },
  accommodation: {
    bg: 'bg-purple-500',
    text: 'text-white',
    marker: '#9B87F5',
  },
};

export const getCategoryName = (category: string): string => {
  switch (category) {
    case 'restaurant':
      return '음식점';
    case 'cafe':
      return '카페';
    case 'attraction':
      return '관광지';
    case 'accommodation':
      return '숙소';
    default:
      return category;
  }
};

// 역방향 매핑 함수: 한글 카테고리명 -> 영문 키
export const mapCategoryNameToKey = (categoryName: string): string => {
  switch (categoryName) {
    case '음식점':
      return 'restaurant';
    case '카페':
      return 'cafe';
    case '관광지':
      return 'attraction';
    case '숙소':
      return 'accommodation';
    default:
      return 'attraction'; // 기본값
  }
};

export const getCategoryColor = (category: string): string => {
  return categoryColors[category]?.marker || '#1F1F1F';
};
