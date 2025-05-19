
import { useState, useEffect, useCallback } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results'; // Assuming this is used by CategoryResultPanel directly
import { useItinerary, ItineraryDay } from './use-itinerary';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection'; // Uses English CategoryName internally
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state'; // Uses English CategoryName keys
import { Place, SelectedPlace, CategoryName, CategoryNameKorean, toCategoryNameKorean } from '@/types';
import { toast } from 'sonner';

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection(); 
  const tripDetails = useTripDetails();
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | null>(null); 
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  
  const { directInputValues, onDirectInputChange } = useInputState(); // directInputValues keys are English CategoryName

  const keywordsAndInputs = {
    directInputValues, // Keys are English CategoryName e.g. { accommodation: "value" }
    onDirectInputChange: (categoryKey: CategoryName, value: string) => { 
      onDirectInputChange(categoryKey, value); // Expects English CategoryName key
    },
    handleConfirmCategory: (category: CategoryName, finalKeywords: string[], clearSelection: boolean = false) => { 
      categorySelection.handleConfirmCategory(category, finalKeywords, clearSelection); // Expects English CategoryName
    }
  };

  const {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory, // Keys are CategoryNameKorean
    handleSelectPlace, // Third arg is CategoryName (English) or string to be converted
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected, // Based on CategoryNameKorean counts
    prepareSchedulePayload,
    isAccommodationLimitReached, // Expects CategoryNameKorean '숙소'
    handleAutoCompletePlaces, // First arg is CategoryNameKorean
    isPlaceSelected
  } = useSelectedPlaces();

  const placesManagement = {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    isAccommodationLimitReached,
    prepareSchedulePayload,
    handleAutoCompletePlaces,
    isPlaceSelected
  };

  const { 
    itinerary,
    selectedItineraryDay,
    showItinerary, 
    isItineraryCreated,
    setItinerary, 
    setSelectedItineraryDay,
    setShowItinerary, 
    setIsItineraryCreated,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setItinerary, 
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary,
    isItineraryCreated,
    setIsItineraryCreated
  };
  
  const uiVisibility = {
    showItinerary,
    setShowItinerary,
  };

  // Placeholder states, as useCategoryResults is likely used directly in CategoryResultPanel
  const [isCategoryLoading, setIsCategoryLoading] = useState(false); 
  const [categoryError, setCategoryError] = useState<Error | null>(null); 
  const categoryResults = { recommendedPlaces: [], normalPlaces: [] }; 


  const categoryHandlers = useCategoryHandlers(); 
  const handleCategorySelect = (category: CategoryName) => { // Expects English
    setSelectedCategory(category);
    // categoryHandlers.handleCategorySelect(category); // refetch logic would be internal to useCategoryResults
  };

  const handleCloseCategoryResult = () => {
    // This is handled by LeftPanel.tsx by setting categoryResultPanelCategory to null
  };
  const handleConfirmCategoryFromButton = () => {
    if (selectedCategory) {
      // categoryHandlers.handleConfirmCategory(selectedCategory);
      // This would set categoryResultPanelCategory in LeftPanel.tsx
    }
  };
  
  const itineraryHandlers = useItineraryHandlers(); 
  
  const handleInitiateItineraryCreation = useCallback(async () => {
    console.log('[useLeftPanel] handleInitiateItineraryCreation 호출됨');
    
    if (!tripDetails.dates || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    if (placesManagement.selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }

    // Ensure isGenerating is properly obtained from itineraryHandlers
    const isCurrentlyGenerating = itineraryHandlers.isGenerating;
    if (isCurrentlyGenerating) {
        toast.info("이미 일정을 생성 중입니다.");
        return false;
    }

    const success = await itineraryHandlers.handleCreateItinerary(
      tripDetails, 
      placesManagement.selectedPlaces as Place[], 
      placesManagement.prepareSchedulePayload, 
      itineraryManagement.generateItinerary,  
      uiVisibility.setShowItinerary,
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
    
    if (success) {
      console.log('[useLeftPanel] Itinerary creation process initiated. Waiting for itineraryCreated event.');
    } else {
      console.log('[useLeftPanel] Itinerary creation process failed to initiate or complete.');
    }
    
    return success;
  }, [
      tripDetails, 
      placesManagement, 
      itineraryManagement.generateItinerary, 
      itineraryHandlers, 
      uiVisibility.setShowItinerary, 
      setCurrentPanel
  ]);
  
  const handleCloseItineraryPanel = () => { 
    itineraryHandlers.handleCloseItinerary(
      uiVisibility.setShowItinerary, 
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
    itineraryManagement.setItinerary(null); 
    itineraryManagement.setIsItineraryCreated(false);
  };

  useEffect(() => {
    if (itineraryManagement.isItineraryCreated && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0) {
      if (!uiVisibility.showItinerary) {
         console.log("useLeftPanel: Itinerary created, ensuring panel is visible.");
         uiVisibility.setShowItinerary(true);
      }
      if (currentPanel !== 'itinerary') {
        setCurrentPanel('itinerary');
      }
    }
  }, [itineraryManagement.isItineraryCreated, itineraryManagement.itinerary, uiVisibility.showItinerary, currentPanel, uiVisibility]); // Added uiVisibility to dependencies

  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const forceRerenderListener = () => {
      console.log("[useLeftPanel] 'forceRerender' event caught, updating dummy state.");
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('forceRerender', forceRerenderListener);
    return () => {
      window.removeEventListener('forceRerender', forceRerenderListener);
    };
  }, []);

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary: handleInitiateItineraryCreation,
    selectedCategory,
    currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton, 
    handleCloseItinerary: handleCloseItineraryPanel,
    isGeneratingItinerary: itineraryHandlers.isGenerating, 
  };
};
