
import { useState, useCallback, useMemo } from 'react';
import { SelectedPlace, CategoryName, MINIMUM_RECOMMENDATION_COUNT, Place } from '@/types/index';
import { useSelectedPlacesDerivedState } from './places/use-selected-places-derived-state';
import { usePlaceSelectionLogic, PlaceSelectionLogicDeps } from './places/use-place-selection-logic';
import { usePlaceAutoCompletion, PlaceAutoCompletionDeps } from './places/use-place-auto-completion';
import { toast } from 'sonner';

interface UseSelectedPlacesProps {
  initialSelectedPlaces?: SelectedPlace[];
  tripDuration: number | null;
}

export const useSelectedPlaces = ({ initialSelectedPlaces = [], tripDuration }: UseSelectedPlacesProps) => {
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>(initialSelectedPlaces);
  const [candidatePlaces, setCandidatePlaces] = useState<SelectedPlace[]>([]);

  const derivedState = useSelectedPlacesDerivedState({ selectedPlaces, tripDuration });
  const { selectedPlacesByCategory, isAccommodationLimitReached, getMissingCountForCategory, allCategoriesSatisfied } = derivedState;

  const placeSelectionDeps: PlaceSelectionLogicDeps = {
    selectedPlaces,
    setSelectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    isAccommodationLimitReached,
    tripDuration,
    // getMissingCountForCategory, // 이 함수는 PlaceSelectionLogicDeps에 필요하지 않을 수 있음. 확인 필요.
  };
  const placeSelectionLogic = usePlaceSelectionLogic(placeSelectionDeps);

  const placeAutoCompletionDeps: PlaceAutoCompletionDeps = {
    selectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    tripDuration,
    // selectedPlacesByCategory, // PlaceAutoCompletionDeps에 selectedPlacesByCategory가 직접 필요하지 않을 수 있음. getMissingCountForCategory를 통해 전달.
    getMissingCountForCategory,
  };
  const placeAutoCompletion = usePlaceAutoCompletion(placeAutoCompletionDeps);

  const addPlace = useCallback((place: Place, category: CategoryName) => {
    const newSelectedPlace: SelectedPlace = {
      ...place,
      category,
      isSelected: true,
      isCandidate: false,
    };
    // accommodation limit check
    if (category === 'accommodation' && isAccommodationLimitReached) {
        toast.error(`숙소는 최대 ${MINIMUM_RECOMMENDATION_COUNT(tripDuration || 0).accommodation}개까지만 선택할 수 있습니다.`);
        return;
    }
    setSelectedPlaces(prev => [...prev, newSelectedPlace]);
    toast.success(`${place.name}이(가) 선택한 장소에 추가되었습니다.`);
  }, [isAccommodationLimitReached, tripDuration, setSelectedPlaces]);

  // ... 기존 removePlace, togglePlaceSelection, clearSelectedPlaces 등은 placeSelectionLogic에서 가져오도록 수정
  const { removePlace, togglePlaceSelection, clearSelectedPlaces, addCandidatePlace, removeCandidatePlace } = placeSelectionLogic;
  const { runAutoCompletion, isLoading: isAutoCompleting, error: autoCompletionError } = placeAutoCompletion;


  return {
    selectedPlaces,
    setSelectedPlaces, // 직접 상태 변경이 필요할 경우 대비
    candidatePlaces,
    setCandidatePlaces, // 직접 상태 변경이 필요할 경우 대비
    selectedPlacesByCategory,
    isAccommodationLimitReached,
    allCategoriesSatisfied,
    getMissingCountForCategory,
    addPlace,
    removePlace,
    togglePlaceSelection,
    clearSelectedPlaces,
    addCandidatePlace,
    removeCandidatePlace,
    runAutoCompletion,
    isAutoCompleting,
    autoCompletionError,
  };
};
