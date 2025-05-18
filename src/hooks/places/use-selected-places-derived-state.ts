
import { useMemo } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { CategoryName, CATEGORIES, koreanToEnglishCategoryName } from '@/utils/categoryUtils';

interface UseSelectedPlacesDerivedStateProps {
  selectedPlaces: SelectedPlace[]; // selectedPlaces store CategoryName as English
  tripDuration: number | null;
}

export const useSelectedPlacesDerivedState = ({
  selectedPlaces,
  tripDuration,
}: UseSelectedPlacesDerivedStateProps) => {
  const selectedPlacesByCategory = useMemo(() => {
    const grouped: Record<CategoryName, SelectedPlace[]> = {
      'accommodation': [],
      'attraction': [],
      'restaurant': [],
      'cafe': [],
    };
    selectedPlaces.forEach(place => {
      // place.category is already English CategoryName from usePlaceSelectionLogic
      const categoryKey = place.category as CategoryName; 
      if (categoryKey && CATEGORIES.includes(categoryKey)) {
        grouped[categoryKey].push(place);
      } else if (place.category) {
        // Fallback for safety, try to convert if somehow it's still Korean
        const englishCat = koreanToEnglishCategoryName(place.category);
        if (englishCat && CATEGORIES.includes(englishCat)) {
            grouped[englishCat].push(place);
        }
      }
    });
    return grouped;
  }, [selectedPlaces]);

  const allCategoriesSelected = useMemo(() => {
    return CATEGORIES.every(category => { // CATEGORIES is English
      const placesInCat = selectedPlacesByCategory[category] || []; // category is English
      return placesInCat.length > 0;
    });
  }, [selectedPlacesByCategory]);

  const isAccommodationLimitReached = useMemo(() => {
    const maxAccommodations = tripDuration !== null && tripDuration >= 0 ? Math.max(tripDuration, 1) : 1;
    return (selectedPlacesByCategory['accommodation']?.length || 0) >= maxAccommodations; // Key is English
  }, [selectedPlacesByCategory, tripDuration]);

  return {
    selectedPlacesByCategory,
    allCategoriesSelected,
    isAccommodationLimitReached,
  };
};
