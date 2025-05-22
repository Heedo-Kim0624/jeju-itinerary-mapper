
import { useCallback, useEffect } from 'react';
import { Place, SelectedPlace, CategoryName, SchedulePlace } from '@/types/core'; // Ensure types from core
import { useTripDetails } from './use-trip-details';

import { usePlaceCoreState } from './places/use-place-core-state';
import { usePlaceSelectionLogic } from './places/use-place-selection-logic';
import { useSelectedPlacesDerivedState } from './places/use-selected-places-derived-state';
import { usePlaceAutoCompletion } from './places/use-place-auto-completion';
import { useSchedulePayloadBuilder } from './places/use-schedule-payload-builder';

export const useSelectedPlaces = () => {
  const { tripDuration } = useTripDetails();

  const coreState = usePlaceCoreState();
  const {
    selectedPlaces,
    setSelectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    handleRemovePlace, // Keep this
    isPlaceSelected,   // Keep this
  } = coreState;

  const derivedState = useSelectedPlacesDerivedState({ selectedPlaces, tripDuration });
  const {
    selectedPlacesByCategory,
    allCategoriesSelected,       // Keep this
    isAccommodationLimitReached, // Keep this
  } = derivedState;

  const selectionLogic = usePlaceSelectionLogic({
    setSelectedPlaces, // Pass from coreState
    tripDuration,
  });
  const { handleSelectPlace } = selectionLogic; // Keep this
  
  const autoCompletion = usePlaceAutoCompletion({
    selectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    selectedPlacesByCategory,
    tripDuration,
  });
  const { 
    handleAutoCompletePlaces, // Keep this
    isCompleting,             // Add this
    autoCompleteError,        // Add this
  } = autoCompletion;


  const payloadBuilder = useSchedulePayloadBuilder();
  const { prepareSchedulePayload: buildSchedulePayload } = payloadBuilder;
  
  const prepareSchedulePayload = useCallback(
    (
      startDatetimeISO: string | null,
      endDatetimeISO: string | null
    ): SchedulePlace[] | null => { // Correct return type for payload builder based on its usage. Or use SchedulePayload type.
                                // Let's assume buildSchedulePayload now returns SchedulePlace[]
      // The actual buildSchedulePayload function from useSchedulePayloadBuilder will be called here.
      // It will use selectedPlaces and candidatePlaces from the scope of this hook (via coreState).
      // This function's signature needs to match what the consuming hooks expect.
      // For now, let's assume it can take these two args, and `buildSchedulePayload` handles the rest.
      // This needs to align with `useSchedulePayloadBuilder` internal logic for creating the payload.
      
      // The `useSchedulePayloadBuilder` hook's `prepareSchedulePayload` returns `SchedulePayload | null`.
      // So this wrapper should also return that.
      const payload = buildSchedulePayload(selectedPlaces, candidatePlaces, startDatetimeISO, endDatetimeISO);
      return payload ? payload.selected_places.concat(payload.candidate_places) : null; 
      // Or, if `prepareSchedulePayload` in use-left-panel expects SchedulePayload:
      // return buildSchedulePayload(selectedPlaces, candidatePlaces, startDatetimeISO, endDatetimeISO);

    },
    [selectedPlaces, candidatePlaces, buildSchedulePayload]
  );
  
  // Simplified prepareSchedulePayload for use-left-panel
  const prepareFullSchedulePayload = useCallback(
    (startDatetimeISO: string | null, endDatetimeISO: string | null): { selected_places: SchedulePlace[], candidate_places: SchedulePlace[], start_datetime: string, end_datetime: string } | null => {
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
    // From coreState
    selectedPlaces, 
    candidatePlaces, 
    setSelectedPlaces,
    setCandidatePlaces,
    handleRemovePlace, 
    isPlaceSelected, 
    
    // From derivedState
    selectedPlacesByCategory, 
    allCategoriesSelected, 
    isAccommodationLimitReached, 
    
    // From selectionLogic
    handleSelectPlace, 
    
    // From autoCompletion
    handleAutoCompletePlaces, 
    isCompletingAutoCompletion: isCompleting, // Renamed for clarity
    autoCompletionError: autoCompleteError,   // Renamed for clarity

    // Direct
    handleViewOnMap, 
    prepareSchedulePayload: prepareFullSchedulePayload, // Export the full payload builder
  };
};
