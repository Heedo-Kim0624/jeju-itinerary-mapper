
import { useCallback } from 'react';
// Removed CategoryName import from '@/utils/categoryUtils'
import { Place, SelectedPlace, CategoryName, CategoryNameKorean, toCategoryName, toCategoryNameKorean } from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext';

interface PlaceSelectionLogicDeps {
  selectedPlaces: SelectedPlace[];
  setSelectedPlaces: React.Dispatch<React.SetStateAction<SelectedPlace[]>>;
  candidatePlaces: Place[];
  setCandidatePlaces: React.Dispatch<React.SetStateAction<Place[]>>;
  isAccommodationLimitReached: (category: CategoryNameKorean) => boolean;
  tripDuration: number | null;
}

export const usePlaceSelectionLogic = (deps: PlaceSelectionLogicDeps) => {
  const {
    selectedPlaces,
    setSelectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    isAccommodationLimitReached,
    tripDuration,
  } = deps;
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  const handleSelectPlace = useCallback(
    (place: Place, checked: boolean, categoryFromPanel: string | null) => {
      const placeCategoryKorean = toCategoryNameKorean(categoryFromPanel || place.category || 'landmark');
      const placeCategoryEnglish = toCategoryName(categoryFromPanel || place.category || 'landmark');

      if (checked) {
        if (placeCategoryKorean === '숙소' && isAccommodationLimitReached(placeCategoryKorean)) {
          // alert('숙소는 최대 ' + (tripDuration ?? 0) + '개까지 선택할 수 있습니다.');
          return; // Prevent selection
        }
        setSelectedPlaces((prev) => [
          ...prev,
          { ...place, category: placeCategoryEnglish, isSelected: true, isCandidate: false },
        ]);
        setCandidatePlaces((prev) => prev.filter((p) => p.id !== place.id));
      } else {
        setSelectedPlaces((prev) => prev.filter((p) => p.id !== place.id));
        // Optionally add back to candidates if it was from a recommended pool and not a direct search
        // For simplicity, not adding back to candidates automatically here.
      }
    },
    [selectedPlaces, setSelectedPlaces, setCandidatePlaces, isAccommodationLimitReached, tripDuration]
  );

  const handleRemovePlace = useCallback(
    (placeId: string | number) => {
      setSelectedPlaces((prev) => prev.filter((p) => p.id !== placeId));
      // console.log(`장소 제거됨: ${placeId}`);
    },
    [setSelectedPlaces]
  );

  const handleViewOnMap = useCallback(
    (place: Place) => {
      if (place.y && place.x) {
        panTo({ lat: place.y, lng: place.x });
        clearMarkersAndUiElements(); // Clear previous single markers
        addMarkers([place], { highlight: true }); // Add and highlight this one
      }
    },
    [panTo, addMarkers, clearMarkersAndUiElements]
  );
  
  const isPlaceSelected = useCallback(
    (placeId: string | number): boolean => {
      return selectedPlaces.some(p => p.id === placeId);
    },
    [selectedPlaces]
  );


  return { handleSelectPlace, handleRemovePlace, handleViewOnMap, isPlaceSelected };
};
