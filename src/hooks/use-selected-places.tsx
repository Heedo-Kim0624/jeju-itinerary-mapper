
import { useCallback, useEffect } from 'react';
import { Place, SelectedPlace } from '@/types/supabase'; // Ensure SelectedPlace is imported if it's used, Place is used for handleViewOnMap
import { useTripDetails } from './use-trip-details';

import { usePlaceCoreState } from './places/use-place-core-state';
import { usePlaceSelectionLogic } from './places/use-place-selection-logic';
import { useSelectedPlacesDerivedState } from './places/use-selected-places-derived-state';
import { usePlaceAutoCompletion } from './places/use-place-auto-completion';
import { useSchedulePayloadBuilder } from './places/use-schedule-payload-builder';

export const useSelectedPlaces = () => {
  const { tripDuration } = useTripDetails();

  const {
    selectedPlaces,
    setSelectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    handleRemovePlace,
    isPlaceSelected,
  } = usePlaceCoreState();

  const {
    selectedPlacesByCategory,
    allCategoriesSelected,
    isAccommodationLimitReached,
  } = useSelectedPlacesDerivedState({ selectedPlaces, tripDuration });

  const { handleSelectPlace } = usePlaceSelectionLogic({
    setSelectedPlaces,
    tripDuration,
  });
  
  const { handleAutoCompletePlaces } = usePlaceAutoCompletion({
    selectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    selectedPlacesByCategory,
    tripDuration,
  });

  const { prepareSchedulePayload: buildSchedulePayload } = useSchedulePayloadBuilder();
  
  // Updated wrapper for prepareSchedulePayload.
  // It no longer accepts `userSelectedPlacesInput` as it was ignored.
  // It directly uses `selectedPlaces` and `candidatePlaces` from the hook's scope.
  const prepareSchedulePayload = useCallback(
    (
      startDatetimeISO: string | null,
      endDatetimeISO: string | null
    ) => {
      // `selectedPlaces` from usePlaceCoreState are non-candidate (user-selected).
      // `candidatePlaces` from usePlaceCoreState are auto-completed.
      // This aligns with what `buildSchedulePayload` (from useSchedulePayloadBuilder) expects.
      return buildSchedulePayload(selectedPlaces, candidatePlaces, startDatetimeISO, endDatetimeISO);
    },
    [selectedPlaces, candidatePlaces, buildSchedulePayload]
  );


  const handleViewOnMap = useCallback((place: Place) => {
    console.log("지도에서 보기:", place);
    // Placeholder for map view functionality
  }, []);

  useEffect(() => {
    console.log("[SelectedPlaces Hook] 선택된 장소 변경됨 (사용자 선택):", selectedPlaces);
    console.log("[SelectedPlaces Hook] 후보 장소 변경됨 (자동 보완):", candidatePlaces);
    console.log("[SelectedPlaces Hook] 현재 여행 기간(박):", tripDuration);
  }, [selectedPlaces, candidatePlaces, tripDuration]);

  return {
    selectedPlaces, // from usePlaceCoreState
    candidatePlaces, // from usePlaceCoreState
    selectedPlacesByCategory, // from useSelectedPlacesDerivedState
    handleSelectPlace, // from usePlaceSelectionLogic
    handleRemovePlace, // from usePlaceCoreState
    handleViewOnMap, // kept here
    allCategoriesSelected, // from useSelectedPlacesDerivedState
    isAccommodationLimitReached, // from useSelectedPlacesDerivedState
    isPlaceSelected, // from usePlaceCoreState
    handleAutoCompletePlaces, // from usePlaceAutoCompletion
    prepareSchedulePayload, // refactored wrapper
    setCandidatePlaces, // from usePlaceCoreState
    setSelectedPlaces, // from usePlaceCoreState
  };
};

