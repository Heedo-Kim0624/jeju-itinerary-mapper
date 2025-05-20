
import { useEffect } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useInputState } from './left-panel/use-input-state';
import { useLeftPanelState } from './left-panel/use-left-panel-state';
import { useItineraryCreation } from './left-panel/use-itinerary-creation';
import { useCategoryResultHandlers } from './left-panel/use-category-result-handlers';
import { useEventListeners } from './left-panel/use-event-listeners';

/**
 * 왼쪽 패널 기능 통합 훅
 * Main hook that composes all left panel functionality
 */
export const useLeftPanel = () => {
  // Core state management
  const leftPanelState = useLeftPanelState();
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();
  const { directInputValues, onDirectInputChange } = useInputState();
  
  // Set up event listeners
  useEventListeners(
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  // Place management
  const placesManagement = useSelectedPlaces();

  // Itinerary management
  const itineraryManagement = useItinerary();

  // UI visibility
  const uiVisibility = {
    showItinerary: itineraryManagement.showItinerary,
    setShowItinerary: itineraryManagement.setShowItinerary,
    showCategoryResult: leftPanelState.showCategoryResult,
    setShowCategoryResult: leftPanelState.setShowCategoryResult
  };

  // Category handlers
  const categoryHandlers = useCategoryHandlers();
  
  // Keyword and input management
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category as any, finalKeywords, clearSelection);
      if (clearSelection) {
        leftPanelState.setShowCategoryResult(category as any);
      }
    }
  };

  // Category result handlers
  const categoryResultHandlers = useCategoryResultHandlers(
    regionSelection.selectedRegions,
    tripDetails,
    placesManagement.handleAutoCompletePlaces,
    leftPanelState.setShowCategoryResult
  );

  // Itinerary creation logic
  const itineraryCreation = useItineraryCreation(
    tripDetails,
    placesManagement.selectedPlaces,
    placesManagement.prepareSchedulePayload,
    itineraryManagement.generateItinerary,
    itineraryManagement.setShowItinerary,
    leftPanelState.setCurrentPanel,
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  // Category results from API
  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(
    leftPanelState.showCategoryResult, 
    leftPanelState.showCategoryResult 
      ? categorySelection.selectedKeywordsByCategory[leftPanelState.showCategoryResult] || [] 
      : [], 
    regionSelection.selectedRegions
  );

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // Handle panel navigation and view changes based on itinerary state
  useEffect(() => {
    if (itineraryManagement.isItineraryCreated && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0) {
      if (!uiVisibility.showItinerary) {
         console.log("useLeftPanel: Itinerary created, ensuring panel is visible.");
         uiVisibility.setShowItinerary(true);
      }
      if (leftPanelState.currentPanel !== 'itinerary') {
        leftPanelState.setCurrentPanel('itinerary');
      }
    }
  }, [
    itineraryManagement.isItineraryCreated, 
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, // Keep uiVisibility.showItinerary as dependency
    leftPanelState.currentPanel,
    // Add missing dependencies from leftPanelState and uiVisibility used in the effect
    leftPanelState.setCurrentPanel,
    uiVisibility.setShowItinerary
  ]);

  // Combine and return all necessary functionality
  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement: {
      itinerary: itineraryManagement.itinerary,
      selectedItineraryDay: itineraryManagement.selectedItineraryDay,
      handleSelectItineraryDay: itineraryManagement.handleSelectItineraryDay,
      // Consider exposing isItineraryCreated directly if needed elsewhere
    },
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    selectedCategory: leftPanelState.selectedCategory,
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    categoryResultHandlers, // Expose all category result handlers
    handleCategorySelect: (category: string) => 
      categoryHandlers.handleCategorySelect(category, refetch),
    // Removed handleCloseCategoryResult and handleConfirmCategory as they are part of categoryResultHandlers and categoryHandlers respectively
    isGeneratingItinerary: leftPanelState.isGenerating,
    itineraryReceived: leftPanelState.itineraryReceived, // Exposed itineraryReceived
  };
};
