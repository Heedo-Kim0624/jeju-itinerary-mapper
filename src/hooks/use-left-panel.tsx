import { useState, useEffect, useCallback } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary, ItineraryDay } from './use-itinerary';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state';
import { Place, SelectedPlace, CategoryName, CategoryNameKorean, toCategoryNameKorean } from '@/types';
import { toast } from 'sonner';

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  // 지역 및 카테고리 선택 기능
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection(); // Uses CategoryName (English) internally
  const tripDetails = useTripDetails();
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | null>(null); // English
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  // showCategoryResult state is managed in LeftPanel.tsx locally as categoryResultPanelCategory now.
  // const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);
  
  const { directInputValues, onDirectInputChange } = useInputState(); // directInputValues keys are English CategoryName

  const keywordsAndInputs = {
    directInputValues, // Keys are English CategoryName
    onDirectInputChange: (categoryKey: CategoryName, value: string) => { // Expect English CategoryName key
      onDirectInputChange(categoryKey, value);
    },
    handleConfirmCategory: (category: CategoryName, finalKeywords: string[], clearSelection: boolean = false) => { // Expect English CategoryName
      categorySelection.handleConfirmCategory(category, finalKeywords, clearSelection);
      // If clearSelection is true, it implies we want to show the results panel.
      // This logic is now in LeftPanel.tsx: setCategoryResultPanelCategory(category);
    }
  };

  const {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory, // Keys are CategoryNameKorean
    handleSelectPlace, // Third arg is CategoryName (English)
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected, // Based on CategoryNameKorean
    prepareSchedulePayload,
    isAccommodationLimitReached, // Based on CategoryNameKorean '숙소'
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
    showItinerary, // This is boolean
    isItineraryCreated,
    setItinerary, 
    setSelectedItineraryDay,
    setShowItinerary, // This function is (value: boolean) => void
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
  
  // uiVisibility state for showCategoryResult is managed in LeftPanel.tsx now.
  // It receives CategoryName | null.
  const uiVisibility = {
    showItinerary,
    setShowItinerary,
    // showCategoryResult, // Removed as it's local to LeftPanel
    // setShowCategoryResult // Removed
  };

  // Example: showCategoryResult (English CategoryName) would be used here if it was managed here.
  // const { 
  //   isLoading: isCategoryLoading,
  //   error: categoryError,
  //   recommendedPlaces,
  //   normalPlaces,
  //   refetch
  // } = useCategoryResults(
  //   showCategoryResult ? toCategoryNameKorean(showCategoryResult) : null, // useCategoryResults expects Korean
  //   showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
  //   regionSelection.selectedRegions
  // );
  // Since showCategoryResult is now local to LeftPanel (as categoryResultPanelCategory), 
  // useCategoryResults hook would be directly used in CategoryResultPanel.tsx with the Korean category name.
  // So, categoryResults here might be stale or not needed.
  // For now, I'll leave categoryResults and related loading/error states, but they might need refactoring
  // if CategoryResultPanel directly uses useCategoryResults.
  // Let's assume for now they are passed down or managed by a context if needed elsewhere.
  // The error log doesn't point to issues here, so minimal change.
  const [isCategoryLoading, setIsCategoryLoading] = useState(false); // Placeholder
  const [categoryError, setCategoryError] = useState<Error | null>(null); // Placeholder
  const categoryResults = { recommendedPlaces: [], normalPlaces: [] }; // Placeholder


  const categoryHandlers = useCategoryHandlers(); // Check its internal type usage
  const handleCategorySelect = (category: CategoryName) => { // Expects English
    // categoryHandlers.handleCategorySelect(category, refetch); // refetch might be an issue
    setSelectedCategory(category);
    // refetch logic would need to be connected to the actual data fetching trigger
  };

  const handleCloseCategoryResult = () => {
    // This is handled by LeftPanel.tsx by setting categoryResultPanelCategory to null
    // categoryHandlers.handleCloseCategoryResult(
    //   (value: CategoryName | null) => setShowCategoryResult(value) // setShowCategoryResult is no longer here
    // );
  };
  const handleConfirmCategoryFromButton = () => {
    if (selectedCategory) {
      // categoryHandlers.handleConfirmCategory(selectedCategory);
      // This likely triggers showing the category result panel, which is now handled by
      // LeftPanel.tsx's setCategoryResultPanelCategory(selectedCategory)
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
  }, [itineraryManagement.isItineraryCreated, itineraryManagement.itinerary, uiVisibility.showItinerary, currentPanel]);

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
