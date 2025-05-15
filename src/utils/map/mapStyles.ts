
// Map styling utilities for the Jeju Map components

/**
 * Returns a color for a specific category
 * @param category The category name
 */
export const getCategoryColor = (category: string): string => {
  // Convert category to lowercase for case-insensitive matching
  const normalizedCategory = category.toLowerCase();
  
  switch (normalizedCategory) {
    case 'attraction':
    case '관광지':
    case '명소':
      return '#4CAF50'; // Green for attractions
      
    case 'restaurant':
    case '음식점':
      return '#FF5252'; // Red for restaurants
      
    case 'cafe':
    case '카페':
      return '#9C27B0'; // Purple for cafes
      
    case 'accommodation':
    case '숙소':
      return '#2196F3'; // Blue for accommodations
      
    case 'shopping':
    case '쇼핑':
      return '#FF9F43'; // Orange for shopping
      
    default:
      return '#757575'; // Gray for other categories
  }
};

// Map marker size configuration
export const getMarkerSize = (isHighlighted: boolean = false): { width: number, height: number } => {
  return isHighlighted 
    ? { width: 36, height: 36 } 
    : { width: 24, height: 24 };
};

// Map route styling options
export const routeStyles = {
  default: {
    strokeColor: '#3366FF',
    strokeWeight: 4,
    strokeOpacity: 0.8,
    zIndex: 100
  },
  highlight: {
    strokeColor: '#FF3B30',
    strokeWeight: 6,
    strokeOpacity: 0.9,
    zIndex: 200
  },
  alternative: {
    strokeColor: '#5856D6',
    strokeWeight: 3,
    strokeOpacity: 0.7,
    zIndex: 90
  }
};
