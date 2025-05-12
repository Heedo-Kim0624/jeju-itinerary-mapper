
import { useEffect } from 'react';
import { useCategorySelection } from './use-category-selection';
import { useRegionSelection } from './use-region-selection';
import { useTripDetails } from './use-trip-details';
import { useSelectedPlaces } from './use-selected-places';
import { useInputHandlers } from './left-panel/use-input-handlers';
import { usePanelHandlers } from './left-panel/use-panel-handlers';
import { useItineraryActions } from './left-panel/use-itinerary-actions';

export const useLeftPanel = () => {
  // Place selection functionality
  const {
    selectedPlaces,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected
  } = useSelectedPlaces();
  
  // Category selection functionality
  const {
    stepIndex: categoryStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    handleCategoryButtonClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
  } = useCategorySelection();

  // Region selection functionality
  const {
    selectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle
  } = useRegionSelection();

  // Trip details functionality
  const {
    dates,
    setDates,
  } = useTripDetails();

  // Input handlers for direct input fields
  const { directInputValues, onDirectInputChange } = useInputHandlers();

  // UI visibility and panel handlers
  const panelHandlers = usePanelHandlers();
  
  // Initialize panel handlers with dependencies
  useEffect(() => {
    panelHandlers.setup(selectedRegions, handleConfirmCategory, handlePanelBack);
  }, [selectedRegions, handleConfirmCategory, handlePanelBack]);
  
  // Itinerary functionality
  const {
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    handleCreateItinerary
  } = useItineraryActions();

  // Debug info - log when important state changes
  useEffect(() => {
    console.log("경로 생성 버튼 상태:", {
      allCategoriesSelected,
      selectedPlaces: selectedPlaces.length
    });
  }, [allCategoriesSelected, selectedPlaces]);

  // Itinerary creation handler wrapping the itinerary actions
  const createItinerary = () => {
    return handleCreateItinerary(selectedPlaces, dates);
  };

  // Return all hooks and handlers grouped by functionality
  return {
    // Region selection
    regionSelection: {
      selectedRegions,
      regionConfirmed,
      setRegionConfirmed,
      regionSlidePanelOpen, 
      setRegionSlidePanelOpen,
      handleRegionToggle
    },
    
    // Category selection
    categorySelection: {
      categoryStepIndex,
      activeMiddlePanelCategory,
      confirmedCategories,
      handleCategoryButtonClick,
      selectedKeywordsByCategory,
      toggleKeyword,
      handlePanelBackByCategory: panelHandlers.handlePanelBackByCategory
    },
    
    // Keywords and inputs
    keywordsAndInputs: {
      directInputValues,
      onDirectInputChange,
      handleConfirmByCategory: panelHandlers.handleConfirmByCategory,
    },
    
    // Places management
    placesManagement: {
      selectedPlaces,
      handleSelectPlace,
      handleRemovePlace,
      handleViewOnMap,
      allCategoriesSelected,
    },
    
    // Trip details
    tripDetails: {
      dates,
      setDates,
    },
    
    // UI visibility
    uiVisibility: panelHandlers.uiVisibility,
    
    // Itinerary management
    itineraryManagement: {
      itinerary,
      selectedItineraryDay,
      handleSelectItineraryDay,
      handleCreateItinerary: createItinerary,
    },
  };
};
