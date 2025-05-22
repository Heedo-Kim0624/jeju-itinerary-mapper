
import { useCallback } from 'react';
import { usePlaceCoreState } from './places/use-place-core-state';
import { usePlaceSelectionLogic } from './places/use-place-selection-logic';
import { usePlaceAutoCompletion } from './places/use-place-auto-completion';
import { useSchedulePayloadBuilder } from './places/use-schedule-payload-builder';

export const useSelectedPlaces = () => {
  // Core state for selected places
  const { 
    selectedPlaces,
    setSelectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
  } = usePlaceCoreState();

  // Auto-completion of places based on selection
  const { 
    autoCompletePlaces, 
    isCompleting,
    error: autoCompleteError
  } = usePlaceAutoCompletion();

  // Selection/deselection logic
  const { 
    addSelectedPlace, 
    removeSelectedPlace,
    toggleSelectedPlace,
    clearSelectedPlaces,
    clearCandidatePlaces,
    filterSelectedPlacesByCategory,
  } = usePlaceSelectionLogic({
    selectedPlaces,
    setSelectedPlaces,
    candidatePlaces,
    setCandidatePlaces
  });
  
  // Payload builder for schedule API
  const { prepareSchedulePayload } = useSchedulePayloadBuilder({
    selectedPlaces,
    candidatePlaces
  });
  
  // Handler for auto-completing places based on current selection
  const handleAutoCompletePlaces = useCallback(async () => {
    // 매개변수 없이 호출하도록 수정
    try {
      const completedPlaces = await autoCompletePlaces();
      if (completedPlaces && completedPlaces.length > 0) {
        setCandidatePlaces(completedPlaces);
        return completedPlaces;
      }
      return [];
    } catch (error) {
      console.error("Failed to auto-complete places:", error);
      return [];
    }
  }, [autoCompletePlaces, setCandidatePlaces]);

  return {
    // Core state
    selectedPlaces,
    candidatePlaces,
    
    // Actions
    addSelectedPlace,
    removeSelectedPlace,
    toggleSelectedPlace,
    clearSelectedPlaces,
    clearCandidatePlaces,
    filterSelectedPlacesByCategory,
    handleAutoCompletePlaces,
    
    // API Payload preparation
    prepareSchedulePayload,
    
    // Auto-completion state
    isCompleting,
    autoCompleteError,
  };
};
