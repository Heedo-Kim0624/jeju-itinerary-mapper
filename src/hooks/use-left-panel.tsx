
import { useEffect } from 'react';
import { useCategorySelection } from './use-category-selection';
import { useRegionSelection } from './use-region-selection';
import { useTripDetails } from './use-trip-details';
import { usePanelVisibility } from './use-panel-visibility';
import { useSelectedPlaces } from './use-selected-places';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useItinerary } from './use-itinerary';
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
    startDate,
    endDate,
    startTime,
    endTime,
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

  // Itinerary functionality
  const {
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const { panTo } = useMapContext();

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

  // Category-specific confirmation handlers
  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('숙소', finalKeywords, clearSelection);
      setShowCategoryResult('숙소');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('관광지', finalKeywords, clearSelection);
      setShowCategoryResult('관광지');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('음식점', finalKeywords, clearSelection);
      setShowCategoryResult('음식점');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('카페', finalKeywords, clearSelection);
      setShowCategoryResult('카페');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    }
  };

  // Panel back handlers by category
  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack(),
    landmark: () => handlePanelBack(),
    restaurant: () => handlePanelBack(),
    cafe: () => handlePanelBack()
  };

  // Result close handler
  const handleResultClose = () => {
    setShowCategoryResult(null);
  };

  // Itinerary creation handler
  const handleCreateItinerary = () => {
    if (dates && selectedPlaces.length > 0) {
      console.log("경로 생성 시작:", {
        장소수: selectedPlaces.length,
        날짜: dates
      });
      
      const generatedItinerary = generateItinerary(
        selectedPlaces,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
      
      if (generatedItinerary) {
        setShowItinerary(true);
      }
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
