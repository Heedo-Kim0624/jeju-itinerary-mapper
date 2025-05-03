
import { useEffect } from 'react';
import { useCategorySelection } from './use-category-selection';
import { useRegionSelection } from './use-region-selection';
import { useTripDetails } from './use-trip-details';
import { usePanelVisibility } from './use-panel-visibility';
import { useSelectedPlaces } from './use-selected-places';
import { useItineraryHandling } from './panel/use-itinerary-handling';
import { useCategoryResultHandling } from './panel/use-category-result-handling';
import { useKeywordConfirmation } from './panel/use-keyword-confirmation';
import { usePanelCoordinates } from './panel/use-panel-coordinates';
import { Place } from '@/types/supabase';

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
    accomodationDirectInput,
    setAccomodationDirectInput,
    landmarkDirectInput,
    setLandmarkDirectInput,
    restaurantDirectInput,
    setRestaurantDirectInput,
    cafeDirectInput,
    setCafeDirectInput,
  } = useTripDetails();

  // Panel visibility functionality
  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult,
  } = usePanelVisibility();

  // Coordinates and map management
  const { panToSelectedRegion } = usePanelCoordinates(selectedRegions);

  // Category result handling
  const { 
    handleResultClose,
    handleShowCategoryResult
  } = useCategoryResultHandling(selectedRegions);

  // Keyword confirmation handling
  const {
    handleConfirmByCategory,
    handlePanelBackByCategory
  } = useKeywordConfirmation(handleShowCategoryResult);

  // Itinerary management
  const {
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
  } = useItineraryHandling();

  // Debug info - log when important state changes
  useEffect(() => {
    console.log("경로 생성 버튼 상태:", {
      allCategoriesSelected,
      selectedPlaces: selectedPlaces.length
    });
  }, [allCategoriesSelected, selectedPlaces]);

  // Group direct input values and handlers for cleaner code
  const directInputValues = {
    accomodation: accomodationDirectInput,
    landmark: landmarkDirectInput,
    restaurant: restaurantDirectInput,
    cafe: cafeDirectInput
  };

  const onDirectInputChange = {
    accomodation: setAccomodationDirectInput,
    landmark: setLandmarkDirectInput,
    restaurant: setRestaurantDirectInput,
    cafe: setCafeDirectInput
  };

  // Itinerary creation handler
  const handleCreateItinerary = () => {
    if (dates && selectedPlaces.length > 0) {
      const { startDate, endDate, startTime, endTime } = dates;
      
      useItineraryHandling().handleCreateItinerary(
        selectedPlaces, 
        startDate, 
        endDate, 
        startTime, 
        endTime
      );
    } else {
      console.error("경로 생성 불가:", { 날짜있음: !!dates, 장소수: selectedPlaces.length });
    }
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
      handlePanelBackByCategory
    },
    
    // Keywords and inputs
    keywordsAndInputs: {
      directInputValues,
      onDirectInputChange,
      handleConfirmByCategory,
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
    uiVisibility: {
      showItinerary,
      setShowItinerary,
      showCategoryResult,
      setShowCategoryResult,
      handleResultClose,
    },
    
    // Itinerary management
    itineraryManagement: {
      itinerary,
      selectedItineraryDay,
      handleSelectItineraryDay,
      handleCreateItinerary,
    },
  };
};
