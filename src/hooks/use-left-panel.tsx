
import { useState, useEffect } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary'; // Fetches ItineraryDay type
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state';
import { Place, SelectedPlace, SchedulePayload, ItineraryDay } from '@/types/supabase'; // Added ItineraryDay
import { CategoryName } from '@/utils/categoryUtils';

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  // 지역 및 카테고리 선택 기능
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();
  
  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  const {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    isAccommodationLimitReached,
    handleAutoCompletePlaces,
    isPlaceSelected // Now correctly sourced from useSelectedPlaces
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
    isPlaceSelected // Added from previous refactor, ensure it's here
  };

  // 일정 관리 기능 (from useItinerary)
  const { 
    itinerary, // This is ItineraryDay[] | null
    selectedItineraryDay, // This is number | null
    showItinerary,
    // setItinerary, // Not directly used by LeftPanel, managed internally by useItinerary or useScheduleManagement
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary // This is the client-side generator from useItinerary
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary // Exporting client-side generator for use by itineraryHandlers
  };

  // UI 가시성 관리
  const uiVisibility = {
    showItinerary,
    setShowItinerary,
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
    recommendedPlaces: recommendedPlaces || [], // Ensure it's always an array
    normalPlaces: normalPlaces || [] // Ensure it's always an array
  };

  // 카테고리 핸들러
  const categoryHandlers = useCategoryHandlers();
  const handleCategorySelect = (category: string) => categoryHandlers.handleCategorySelect(category, refetch);
  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value)
  );
  const handleConfirmCategoryFromButton = () => categoryHandlers.handleConfirmCategory(selectedCategory);


  // 일정 핸들러 (useItineraryHandlers)
  const itineraryHandlers = useItineraryHandlers();
  
  // Updated handleCreateItinerary call
  const handleCreateItinerary = async () => {
    // Ensure tripDetails provides the correct structure expected by useItineraryHandlers
    // The tripDetails object from useTripDetails includes dates, startDatetime, and endDatetime
    return itineraryHandlers.handleCreateItinerary(
      tripDetails, // Pass the whole tripDetails object
      placesManagement.selectedPlaces as SelectedPlace[], // Pass selected places
      placesManagement.prepareSchedulePayload, // Pass the payload generation function
      itineraryManagement.generateItinerary, // Pass the client-side itinerary generation function
      uiVisibility.setShowItinerary,
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
  };
  
  const handleCloseItinerary = () => {
    itineraryHandlers.handleCloseItinerary(
      uiVisibility.setShowItinerary, 
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
  };

  // 일정이 생성되면 첫 번째 날짜 선택
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && showItinerary) {
      setSelectedItineraryDay(itinerary[0]?.day || 1);
    }
  }, [itinerary, showItinerary, setSelectedItineraryDay]);

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement, // This includes the client-side generateItinerary
    handleCreateItinerary, // This uses itineraryHandlers which in turn uses client-side generateItinerary
    selectedCategory,
    showCategoryResultScreen,
    currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton, // Renamed to avoid conflict if needed
    handleCloseItinerary
  };
};
