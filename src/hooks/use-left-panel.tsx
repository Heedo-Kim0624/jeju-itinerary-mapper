
import { useEffect } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useItinerary } from './use-itinerary';
import { useRegionSelection } from './use-region-selection';
// Removed direct imports for category-related hooks, they will be in useLeftPanelCategoryLogic
import { useLeftPanelState } from './left-panel/use-left-panel-state';
import { useItineraryCreation } from './left-panel/use-itinerary-creation';
import { useEventListeners } from './left-panel/use-event-listeners';
import { useItineraryGenerationAdapter } from './left-panel/useItineraryGenerationAdapter';
import { useLeftPanelVisibility } from './left-panel/useLeftPanelVisibility'; // New hook
import { useLeftPanelCategoryLogic } from './left-panel/useLeftPanelCategoryLogic'; // New hook
import type { ItineraryDay } from '@/types/core';

/**
 * 왼쪽 패널 기능 통합 훅
 * Main hook that composes all left panel functionality
 */
export const useLeftPanel = () => {
  // Core state management
  const leftPanelState = useLeftPanelState();
  const regionSelection = useRegionSelection();
  const tripDetailsHookResult = useTripDetails();
  
  useEventListeners(
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  const placesManagement = useSelectedPlaces();
  const itineraryManagementHook = useItinerary();

  const uiVisibility = useLeftPanelVisibility({ // Using the new hook
    itineraryManagementHook,
    leftPanelState,
  });

  const categoryLogic = useLeftPanelCategoryLogic({ // Using the new hook
    leftPanelState,
    regionSelection,
    tripDetailsHookResult,
    placesManagement,
    // directInputValues and onDirectInputChange are now managed inside useLeftPanelCategoryLogic via useInputState
  });

  const { generateItineraryAdapter } = useItineraryGenerationAdapter({
    itineraryManagementHook,
    placesManagement,
    tripDetailsHookResult,
  });

  const enhancedItineraryManagementHook = {
    ...itineraryManagementHook,
    handleServerItineraryResponse: (itinerary: ItineraryDay[]) => {
      if (itinerary && itinerary.length > 0) {
        itineraryManagementHook.setItinerary(itinerary);
        itineraryManagementHook.setIsItineraryCreated(true);
        return itinerary;
      } else {
        console.warn("Empty or invalid itinerary received");
        itineraryManagementHook.setItinerary([]);
        itineraryManagementHook.setIsItineraryCreated(false);
        return [];
      }
    }
  };

  const itineraryCreation = useItineraryCreation({
    tripDetails: tripDetailsHookResult,
    userDirectlySelectedPlaces: placesManagement.selectedPlaces,
    autoCompleteCandidatePlaces: placesManagement.candidatePlaces,
    prepareSchedulePayload: placesManagement.prepareSchedulePayload,
    generateItinerary: generateItineraryAdapter,
    setShowItinerary: uiVisibility.setShowItinerary, // from new hook
    setCurrentPanel: leftPanelState.setCurrentPanel,
    setIsGenerating: leftPanelState.setIsGenerating,
    setItineraryReceived: leftPanelState.setItineraryReceived,
  });

  useEffect(() => {
    if (itineraryManagementHook.isItineraryCreated && itineraryManagementHook.itinerary && itineraryManagementHook.itinerary.length > 0) {
      if (!uiVisibility.showItinerary) {
         console.log("useLeftPanel: Itinerary created, ensuring panel is visible.");
         uiVisibility.setShowItinerary(true);
      }
      if (leftPanelState.currentPanel !== 'itinerary') {
        leftPanelState.setCurrentPanel('itinerary');
      }
    }
  }, [
    itineraryManagementHook.isItineraryCreated, 
    itineraryManagementHook.itinerary, 
    uiVisibility.showItinerary, 
    leftPanelState.currentPanel,
    leftPanelState.setCurrentPanel,
    uiVisibility.setShowItinerary
  ]);

  return {
    regionSelection,
    categorySelection: categoryLogic.categorySelection,
    keywordsAndInputs: categoryLogic.keywordsAndInputs,
    placesManagement,
    tripDetails: tripDetailsHookResult,
    uiVisibility, // from new hook
    itineraryManagement: { 
      itinerary: itineraryManagementHook.itinerary,
      selectedItineraryDay: itineraryManagementHook.selectedItineraryDay,
      handleSelectItineraryDay: itineraryManagementHook.handleSelectItineraryDay,
      isItineraryCreated: itineraryManagementHook.isItineraryCreated,
      handleServerItineraryResponse: enhancedItineraryManagementHook.handleServerItineraryResponse,
      showItinerary: itineraryManagementHook.showItinerary, // Retain direct access if needed by consumers
      setShowItinerary: itineraryManagementHook.setShowItinerary, // Retain direct access
    },
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    selectedCategory: leftPanelState.selectedCategory, // Directly from state
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading: categoryLogic.categoryResultsData.isLoading,
    categoryError: categoryLogic.categoryResultsData.error,
    categoryResults: { // Keep the structure expected by consumers
        recommendedPlaces: categoryLogic.categoryResultsData.recommendedPlaces,
        normalPlaces: categoryLogic.categoryResultsData.normalPlaces,
    },
    categoryResultHandlers: categoryLogic.categoryResultHandlers,
    handleCategorySelect: categoryLogic.handleCategorySelect,
    isGeneratingItinerary: leftPanelState.isGenerating,
    itineraryReceived: leftPanelState.itineraryReceived,
  };
};
