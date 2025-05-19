
import { useCallback } from 'react';
// Removed CategoryName import from '@/utils/categoryUtils'
import { Place, SelectedPlace, CategoryName, CategoryNameKorean, toCategoryName, getMinimumRecommendationsByCategory } from '@/types'; // Ensure getMinimumRecommendationsByCategory is from @/types or defined correctly
import { toast } from 'sonner';

interface PlaceAutoCompletionDeps {
  selectedPlaces: SelectedPlace[];
  candidatePlaces: Place[];
  setSelectedPlaces: React.Dispatch<React.SetStateAction<SelectedPlace[]>>;
  setCandidatePlaces: React.Dispatch<React.SetStateAction<Place[]>>;
  isAccommodationLimitReached: (category: CategoryNameKorean) => boolean;
  tripDuration: number | null;
}

export const usePlaceAutoCompletion = (deps: PlaceAutoCompletionDeps) => {
  const {
    selectedPlaces,
    candidatePlaces,
    setSelectedPlaces,
    setCandidatePlaces,
    isAccommodationLimitReached,
    tripDuration,
  } = deps;

  const handleAutoCompletePlaces = useCallback(
    (
      categoryKorean: CategoryNameKorean,
      recommendedPool: Place[],
      actualTravelDays: number
    ) => {
      if (actualTravelDays <= 0) {
        toast.error("여행 기간이 올바르게 설정되지 않았습니다.");
        return;
      }

      const minRecsForCategory = getMinimumRecommendationsByCategory(actualTravelDays);
      const limit = minRecsForCategory[categoryKorean] || 0;

      const currentSelectedInCategory = selectedPlaces.filter(
        (p) => toCategoryName(p.category || '') === toCategoryName(categoryKorean)
      ).length;

      let needed = limit - currentSelectedInCategory;
      if (needed <= 0) {
        toast.info(`${categoryKorean} 카테고리는 이미 충분히 선택되었습니다.`);
        return;
      }

      const placesToAutoAdd: SelectedPlace[] = [];
      const remainingCandidatesForAutoAdd: Place[] = [];

      for (const place of recommendedPool) {
        if (needed <= 0) {
          remainingCandidatesForAutoAdd.push(place);
          continue;
        }
        const isAlreadySelected = selectedPlaces.some((sp) => sp.id === place.id);
        if (isAlreadySelected) continue;

        if (categoryKorean === '숙소' && isAccommodationLimitReached(categoryKorean) && placesToAutoAdd.filter(p => toCategoryName(p.category || '') === 'accommodation').length >= (minRecsForCategory['숙소'] - currentSelectedInCategory) ) {
             // If accommodation limit is reached among newly auto-added places for this run
            remainingCandidatesForAutoAdd.push(place);
            continue;
        }


        placesToAutoAdd.push({
          ...place,
          category: toCategoryName(categoryKorean), // Store as English CategoryName
          isSelected: true,
          isCandidate: false, // Auto-added are considered selected, not candidates
        });
        needed--;
      }
      
      if (placesToAutoAdd.length > 0) {
        setSelectedPlaces((prev) => [...prev, ...placesToAutoAdd]);
        toast.success(
          `${categoryKorean} 카테고리에서 ${placesToAutoAdd.length}개의 장소가 자동으로 추가되었습니다.`
        );
      } else if (limit - currentSelectedInCategory > 0) {
         toast.info(`${categoryKorean} 카테고리에서 더 이상 자동 추가할 추천 장소가 없습니다.`);
      }


      // Update candidate places: remove auto-added ones, add remaining from pool
      setCandidatePlaces(prevCandidates => {
        const autoAddedIds = new Set(placesToAutoAdd.map(p => p.id));
        // Filter out already selected or auto-added from remaining recommended pool
        const newCandidatesFromPool = recommendedPool.filter(p => 
            !selectedPlaces.some(sp => sp.id === p.id) && !autoAddedIds.has(p.id)
        );
        // Combine with existing candidates, removing duplicates
        const combined = [...prevCandidates.filter(pc => !autoAddedIds.has(pc.id)), ...newCandidatesFromPool];
        const uniqueCandidates = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return uniqueCandidates;
      });

    },
    [selectedPlaces, setSelectedPlaces, setCandidatePlaces, isAccommodationLimitReached, getMinimumRecommendationsByCategory, tripDuration]
  );

  return { handleAutoCompletePlaces };
};
