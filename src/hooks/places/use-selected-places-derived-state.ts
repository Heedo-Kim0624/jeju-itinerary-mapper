
import { useMemo } from 'react';
// Removed CategoryName import from '@/utils/categoryUtils'
import { SelectedPlace, CategoryName, CategoryNameKorean, toCategoryNameKorean, CATEGORIES as ALL_CATEGORIES_KOREAN, getMinimumRecommendationsByCategory } from '@/types'; // Ensure CATEGORIES is exported as CategoryNameKorean[]

interface SelectedPlacesDerivedStateDeps {
  selectedPlaces: SelectedPlace[];
  tripDuration: number | null; // 여행 기간 (박)
}

export const useSelectedPlacesDerivedState = (deps: SelectedPlacesDerivedStateDeps) => {
  const { selectedPlaces, tripDuration } = deps;

  const selectedPlacesByCategory = useMemo(() => {
    const byCategory: Partial<Record<CategoryNameKorean, SelectedPlace[]>> = {};
    selectedPlaces.forEach((place) => {
      const koreanCategory = toCategoryNameKorean(place.category || 'landmark'); // Default if category is undefined
      if (!byCategory[koreanCategory]) {
        byCategory[koreanCategory] = [];
      }
      byCategory[koreanCategory]!.push(place);
    });
    return byCategory;
  }, [selectedPlaces]);

  const actualTravelDays = useMemo(() => (tripDuration !== null ? tripDuration + 1 : 0), [tripDuration]);

  const minRecommendations = useMemo(() => {
    if (actualTravelDays <= 0) {
      const defaultMinRecs: Partial<Record<CategoryNameKorean, number>> = {};
      ALL_CATEGORIES_KOREAN.forEach(cat => defaultMinRecs[cat] = 0);
      return defaultMinRecs as Record<CategoryNameKorean, number>;
    }
    return getMinimumRecommendationsByCategory(actualTravelDays);
  }, [actualTravelDays, getMinimumRecommendationsByCategory]);


  const allCategoriesSelected = useMemo(() => {
    if (actualTravelDays <= 0) return false;
    return ALL_CATEGORIES_KOREAN.every((categoryKorean) => {
      const count = selectedPlacesByCategory[categoryKorean]?.length || 0;
      return count >= (minRecommendations[categoryKorean] || 0);
    });
  }, [selectedPlacesByCategory, minRecommendations, actualTravelDays]);

  const isAccommodationLimitReached = useCallback(
    (categoryToCheck: CategoryNameKorean): boolean => {
      if (categoryToCheck !== '숙소' || tripDuration === null || tripDuration < 0) {
        return false; // Not an accommodation or invalid trip duration
      }
      const accommodationCount = selectedPlacesByCategory['숙소']?.length || 0;
      const limit = tripDuration > 1 ? tripDuration -1 : 1; // 숙소는 N박일 때 N-1개 또는 최소 1개
      return accommodationCount >= limit;
    },
    [selectedPlacesByCategory, tripDuration]
  );

  return {
    selectedPlacesByCategory,
    allCategoriesSelected,
    isAccommodationLimitReached,
    minRecommendations, // exposing this for potential UI display
    actualTravelDays
  };
};
