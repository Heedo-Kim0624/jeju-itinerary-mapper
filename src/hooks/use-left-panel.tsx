import { useState, useEffect } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary, ItineraryDay } from './use-itinerary'; // ItineraryDay is now exported
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';

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

  // 일정 관리 기능 (from useItinerary)
  const { 
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary, // Added setItinerary for direct use
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setItinerary, // Expose setItinerary via itineraryManagement
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary
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
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // 카테고리 핸들러
  const categoryHandlers = useCategoryHandlers();
  const handleCategorySelect = (category: string) => categoryHandlers.handleCategorySelect(category, refetch);
  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value)
  );
  const handleConfirmCategoryFromButton = () => categoryHandlers.handleConfirmCategory(selectedCategory);

  // 일정 핸들러
  const itineraryHandlers = useItineraryHandlers();
  
  const handleCreateItinerary = async () => {
    console.log('[useLeftPanel] handleCreateItinerary 호출됨');
    
    // 날짜 정보 로깅
    console.log('[useLeftPanel] 여행 날짜 정보:', {
      dates: tripDetails.dates,
      startDatetime: tripDetails.startDatetime,
      endDatetime: tripDetails.endDatetime
    });
    
    return itineraryHandlers.handleCreateItinerary(
      tripDetails,
      placesManagement.selectedPlaces as SelectedPlace[], // Cast if selectedPlaces is Place[]
      placesManagement.prepareSchedulePayload,
      itineraryManagement.generateItinerary, // Pass the one from useItinerary
      uiVisibility.setShowItinerary, // Pass down setShowItinerary
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
  };
  
  const handleCloseItinerary = () => {
    itineraryHandlers.handleCloseItinerary(
      uiVisibility.setShowItinerary, 
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
  };

  // Listen for itineraryCreated custom event
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      // Type assertion for CustomEvent
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null }>;
      
      console.log("[useLeftPanel] 'itineraryCreated' event received:", customEvent.detail);
      
      if (customEvent.detail.itinerary) {
        // Use the setItinerary from useItinerary directly or via itineraryManagement
        setItinerary(customEvent.detail.itinerary); 
      }
      
      if (customEvent.detail.selectedDay !== null) {
        setSelectedItineraryDay(customEvent.detail.selectedDay);
      } else if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        // Fallback to first day of itinerary if selectedDay is null but itinerary exists
        setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
      } else {
        setSelectedItineraryDay(null);
      }
      
      // Show the itinerary panel if itinerary is created (even if empty, to show potential messages)
      setShowItinerary(true); 
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary]); // Dependencies for the state setters from useItinerary

  // 일정 상태 변경 시 UI 갱신을 위한 useEffect 추가 (from user's Part 2)
  useEffect(() => {
    // 일정이 생성되었지만 showItinerary가 false인 경우 자동으로 활성화
    if (itinerary && itinerary.length > 0 && !showItinerary) {
      console.log("useLeftPanel: 일정이 생성되었으나 패널이 표시되지 않아 자동으로 활성화합니다.");
      setShowItinerary(true);
    }
    
    // 일정이 생성되었지만 선택된 날짜가 없는 경우 첫 번째 날짜 선택
    if (itinerary && itinerary.length > 0 && selectedItineraryDay === null) {
      console.log("useLeftPanel: 일정이 생성되었으나 날짜가 선택되지 않아 첫 번째 날짜를 선택합니다.");
      // Ensure itinerary[0].day is valid before setting
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        setSelectedItineraryDay(itinerary[0].day);
      }
    }
  }, [itinerary, showItinerary, selectedItineraryDay, setShowItinerary, setSelectedItineraryDay]);

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary,
    selectedCategory,
    showCategoryResultScreen,
    currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton, // Renamed for clarity from user's snippet
    handleCloseItinerary
  };
};
