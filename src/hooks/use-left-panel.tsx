import { useState, useEffect, useCallback } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary'; 
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { usePanelHandlers } from './use-panel-handlers';
import { useInputState } from './left-panel/use-input-state';
import { Place, SelectedPlace, SchedulePayload, ItineraryDay } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  // 지역 및 카테고리 선택 기능
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails(); // This now has startDatetimeLocal, endDatetimeLocal
  
  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // showCategoryResultScreen seems unused, let's keep for now if it was there.
  const [showCategoryResultScreen, setShowCategoryResultScreen] = useState(false); 
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);
  
  // 입력값 관리
  const { directInputValues, onDirectInputChange } = useInputState();

  // 키워드 및 입력 관련 기능
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category as CategoryName, finalKeywords, clearSelection);
      if (clearSelection) {
        setShowCategoryResult(category as CategoryName);
      }
    }
  };

  // 장소 관리 기능
  const placesManagement = useSelectedPlaces(tripDetails.tripDuration); // Pass tripDuration

  // 일정 관리 기능 (from useItinerary)
  const { 
    itinerary,
    selectedItineraryDay,
    // showItinerary, // This is now in uiVisibility
    // setShowItinerary, // This is now in uiVisibility
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary, // This is the function we need to ensure gets local datetimes
    isLoading: isItineraryLoading, // from useItinerary
    error: itineraryError, // from useItinerary
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary, // Keep this here for now
    isLoading: isItineraryLoading,
    error: itineraryError,
  };

  // UI 가시성 관리 - showItinerary and setShowItinerary moved here
  const [showItineraryState, setShowItineraryState] = useState(false);
  const uiVisibility = {
    showItinerary: showItineraryState,
    setShowItinerary: setShowItineraryState,
    showCategoryResult,
    setShowCategoryResult
  };

  // 카테고리 결과 관리
  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(showCategoryResult, 
    showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
    regionSelection.selectedRegions);

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // 카테고리 핸들러
  const categoryHandlers = useCategoryHandlers(); // Assuming this is still used
  const handleCategorySelect = (category: string) => categoryHandlers.handleCategorySelect(category, refetch);
  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value)
  );
  const handleConfirmCategoryFromButton = () => categoryHandlers.handleConfirmCategory(selectedCategory);


  // Panel Handlers (includes itinerary creation/closing logic)
  const panelHandlers = usePanelHandlers({
    tripDetails, // Pass full tripDetails which includes local datetimes
    selectedPlaces: placesManagement.selectedPlaces,
    candidatePlaces: placesManagement.candidatePlaces, // Pass candidatePlaces
    prepareSchedulePayload: placesManagement.prepareSchedulePayload, // from useSelectedPlaces
    generateItinerary: itineraryManagement.generateItinerary, // from useItinerary
    setShowItinerary: uiVisibility.setShowItinerary,
    setCurrentPanel,
    clearMarkersAndUiElements: () => { /* This should come from map context or be passed if needed */ },
    setSelectedItineraryDay: itineraryManagement.setSelectedItineraryDay, // Pass this for panelHandlers
    itinerary: itineraryManagement.itinerary, // Pass for panelHandlers
  });
  
  // useEffect for when itinerary is generated
  useEffect(() => {
    if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && uiVisibility.showItinerary) {
      // Select the first valid day
      const firstValidDay = itineraryManagement.itinerary.find(d => d.places.length > 0);
      setSelectedItineraryDay(firstValidDay ? firstValidDay.day : (itineraryManagement.itinerary[0]?.day || 1));
    } else if (!uiVisibility.showItinerary) {
        setSelectedItineraryDay(null); // Clear selected day if itinerary is hidden
    }
  }, [itineraryManagement.itinerary, uiVisibility.showItinerary, setSelectedItineraryDay]);

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    // handleCreateItinerary and handleCloseItinerary are now part of panelHandlers
    selectedCategory,
    showCategoryResultScreen, // Check if used
    currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton, // This is category confirm, not date confirm
    panelHandlers, // Export the new handlers
  };
};
