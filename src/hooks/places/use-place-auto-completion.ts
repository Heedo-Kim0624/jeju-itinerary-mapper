import { useState, useCallback } from 'react';
import { SelectedPlace, CategoryName, MINIMUM_RECOMMENDATION_COUNT, CATEGORIES } from '@/types/index';
import { fetchRecommendedPlaces } from '@/services/placeService';

interface PlaceAutoCompletionDeps {
  selectedPlaces: SelectedPlace[];
  candidatePlaces: SelectedPlace[];
  setCandidatePlaces: React.Dispatch<React.SetStateAction<SelectedPlace[]>>;
  tripDuration: number | null;
  getMissingCountForCategory: (category: CategoryName) => number;
}

export const usePlaceAutoCompletion = ({
  selectedPlaces,
  candidatePlaces,
  setCandidatePlaces,
  tripDuration,
  getMissingCountForCategory,
}: PlaceAutoCompletionDeps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAutoCompletion = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const newCandidatePlaces: SelectedPlace[] = [];

    for (const category of CATEGORIES) {
      const missingCount = getMissingCountForCategory(category as CategoryName);
      if (missingCount > 0) {
        try {
          const recommendedPlaces = await fetchRecommendedPlaces({
            location: '제주',
            category: category,
            count: missingCount,
          });

          recommendedPlaces.forEach(place => {
            const isAlreadySelected = selectedPlaces.some(selectedPlace => selectedPlace.id === place.id);
            const isAlreadyCandidate = candidatePlaces.some(candidatePlace => candidatePlace.id === place.id);

            if (!isAlreadySelected && !isAlreadyCandidate) {
              newCandidatePlaces.push({
                ...place,
                category: category as CategoryName,
                isSelected: false,
                isCandidate: true,
              });
            }
          });
        } catch (err: any) {
          console.error(`Failed to fetch recommended places for ${category}:`, err);
          setError(`장소 추천에 실패했습니다 (${category}).`);
        }
      }
    }

    setCandidatePlaces(prev => [...prev, ...newCandidatePlaces]);
    setIsLoading(false);
  }, [selectedPlaces, candidatePlaces, setCandidatePlaces, tripDuration, getMissingCountForCategory]);

  return {
    runAutoCompletion,
    isLoading,
    error,
  };
};
