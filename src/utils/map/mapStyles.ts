
// Define category colors for consistent styling across the application
export const getCategoryColor = (category: string): string => {
  // Convert category to lowercase for case-insensitive matching
  const categoryKey = category.toLowerCase();
  
  // Map category names to color values
  switch (categoryKey) {
    case 'attraction':
    case '관광지':
    case 'landmark':
      return '#FF6B6B'; // Red for attractions
      
    case 'restaurant':
    case '음식점':
    case 'food':
      return '#4ECDC4'; // Teal for restaurants
      
    case 'cafe':
    case '카페':
    case 'coffee':
      return '#FFE66D'; // Yellow for cafes
      
    case 'accommodation':
    case '숙소':
    case 'hotel':
    case 'lodging':
      return '#54A0FF'; // Blue for accommodations
      
    case 'shopping':
    case '쇼핑':
    case 'market':
    case 'store':
      return '#FF9F43'; // Orange for shopping
      
    case 'culture':
    case '문화':
    case 'museum':
    case 'art':
      return '#A55EEA'; // Purple for cultural spots
      
    case 'nature':
    case '자연':
    case 'park':
    case 'beach':
      return '#20BF6B'; // Green for natural spots
      
    case 'entertainment':
    case '엔터테인먼트':
    case 'activity':
      return '#FA8231'; // Dark orange for entertainment
      
    default:
      return '#778CA3'; // Default gray for unknown categories
  }
};

// Standard route styles for consistent rendering
export const routeStyles = {
  default: {
    strokeColor: '#5347AA',
    strokeWeight: 4,
    strokeOpacity: 0.7,
    zIndex: 100
  },
  highlight: {
    strokeColor: '#FF6B6B',
    strokeWeight: 5,
    strokeOpacity: 0.9,
    zIndex: 200
  },
  secondary: {
    strokeColor: '#4ECDC4',
    strokeWeight: 3,
    strokeOpacity: 0.6,
    zIndex: 90
  },
  inactive: {
    strokeColor: '#AAAAAA',
    strokeWeight: 2,
    strokeOpacity: 0.4,
    zIndex: 50
  }
};

// Marker style constants
export const MARKER_SIZES = {
  default: 24,
  highlighted: 36,
  small: 18,
  large: 42
};

// Export a function to determine if a category is a main category
export const isMainCategory = (category: string): boolean => {
  const mainCategories = [
    'attraction', 'restaurant', 'cafe', 'accommodation', 
    'shopping', 'culture', 'nature', 'entertainment',
    '관광지', '음식점', '카페', '숙소', '쇼핑', '문화', '자연', '엔터테인먼트'
  ];
  
  return mainCategories.includes(category.toLowerCase());
};
