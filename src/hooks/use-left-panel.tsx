
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
  const {
    selectedPlaces,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected
  } = useSelectedPlaces();
  
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

  const {
    selectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle
  } = useRegionSelection();

  // Get both specific trip details and the combined dates object
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

  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult,
  } = usePanelVisibility();

  const {
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const { panTo } = useMapContext();

  // 경로 생성 버튼 활성화 여부 디버깅
  useEffect(() => {
    console.log("경로 생성 버튼 상태:", {
      allCategoriesSelected,
      selectedPlaces: selectedPlaces.length
    });
  }, [allCategoriesSelected, selectedPlaces]);

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

  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack(),
    landmark: () => handlePanelBack(),
    restaurant: () => handlePanelBack(),
    cafe: () => handlePanelBack()
  };

  const handleResultClose = () => {
    setShowCategoryResult(null);
  };

  // 경로 생성 버튼 핸들러
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

  return {
    // Region and selections
    selectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle,
    
    // Category panel
    categoryStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    handleCategoryButtonClick,
    
    // Keywords and inputs
    selectedKeywordsByCategory,
    toggleKeyword,
    directInputValues,
    onDirectInputChange,
    handleConfirmByCategory,
    handlePanelBackByCategory,
    
    // Places
    selectedPlaces,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    
    // Dates and trips
    dates,
    setDates,
    
    // UI visibility
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult,
    handleResultClose,
    
    // Itinerary
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    handleCreateItinerary,
  };
};
