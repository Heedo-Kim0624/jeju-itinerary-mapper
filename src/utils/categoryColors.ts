
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

export const getCategoryColor = (category: string): string => {
  return categoryColors[category]?.marker || '#1F1F1F';
};
