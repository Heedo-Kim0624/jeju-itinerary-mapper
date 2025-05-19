
import { useMemo, useCallback } from 'react'; // useCallback 추가
import { SelectedPlace } from '@/types/supabase'; // supabase 타입은 별도 관리, SelectedPlace는 types/index.ts 에서도 정의됨. 일관성 필요. 여기서는 일단 유지.
import { CategoryName, CATEGORIES, MINIMUM_RECOMMENDATION_COUNT, CategoryNameKorean } from '@/types/index';

interface UseSelectedPlacesDerivedStateProps {
  selectedPlaces: SelectedPlace[];
  tripDuration: number | null;
}

export const useSelectedPlacesDerivedState = ({
  selectedPlaces,
  tripDuration,
}: UseSelectedPlacesDerivedStateProps) => {
  const selectedPlacesByCategory = useMemo(()
: Record<CategoryName, SelectedPlace[]> => {
    const grouped: Record<CategoryName, SelectedPlace[]> = {
      accommodation: [],
      landmark: [],
      restaurant: [],
      cafe: [],
    };
    selectedPlaces.forEach(place => {
      // place.category가 CategoryName 타입임을 보장해야 함
      const categoryKey = place.category as CategoryName;
      if (categoryKey && (CATEGORIES as unknown as CategoryName[]).map(c => c.toLowerCase()).includes(categoryKey)) { // CATEGORIES는 한글, place.category는 영문일 수 있으므로 변환 또는 타입 일치 필요
         if (grouped[categoryKey]) {
            grouped[categoryKey].push(place);
         } else {
            // Handle cases where place.category might not be a key in grouped
            // For now, assuming place.category is always a valid CategoryName
            console.warn(`Place with uncategorized type or mismatch: ${place.name}, category: ${place.category}`);
         }
      } else if (place.category) {
        // Try to map Korean to English if needed, or ensure consistent type for place.category
        // This part might need more robust mapping based on where place.category originates
      }
    });
    return grouped;
  }, [selectedPlaces]);

  const allCategoriesSatisfied = useMemo(() => {
    if (tripDuration === null) return false;
    const minimums = MINIMUM_RECOMMENDATION_COUNT(tripDuration);
    return (Object.keys(minimums) as Array<keyof typeof minimums>).every(categoryKey => {
      const key = categoryKey as CategoryName; // Cast to CategoryName
      return (selectedPlacesByCategory[key]?.length || 0) >= minimums[key];
    });
  }, [selectedPlacesByCategory, tripDuration]);

  const isAccommodationLimitReached = useMemo(() => {
    if (tripDuration === null) return false; // tripDuration이 null일 경우 false 반환
    // n박 -> n개 숙소. 0박 (당일치기) -> 사용자 명세에서는 0개, 이전 코드에서는 1개. MINIMUM_RECOMMENDATION_COUNT 따름.
    const maxAccommodations = MINIMUM_RECOMMENDATION_COUNT(tripDuration).accommodation;
    return (selectedPlacesByCategory['accommodation']?.length || 0) >= maxAccommodations;
  }, [selectedPlacesByCategory, tripDuration]);
  
  // getMinimumRecommendationsByCategory는 MINIMUM_RECOMMENDATION_COUNT로 대체되었으므로 관련 로직 수정
  const getMissingCountForCategory = useCallback((category: CategoryName): number => {
    if (tripDuration === null) return 0;
    const minimums = MINIMUM_RECOMMENDATION_COUNT(tripDuration);
    const currentCount = selectedPlacesByCategory[category]?.length || 0;
    const requiredCount = minimums[category as keyof typeof minimums] || 0; // 타입을 명확히
    return Math.max(0, requiredCount - currentCount);
  }, [selectedPlacesByCategory, tripDuration]);

  return {
    selectedPlacesByCategory,
    allCategoriesSatisfied, // allCategoriesSelected -> allCategoriesSatisfied 로 이름 변경 제안 (의미 명확화)
    isAccommodationLimitReached,
    getMissingCountForCategory, // 추가된 함수 반환
  };
};
