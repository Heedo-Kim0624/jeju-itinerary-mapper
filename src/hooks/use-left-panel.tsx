import { useCallback, useState } from 'react'; // useState 추가
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state';
import { usePanelState } from './left-panel/usePanelState';
import { useLeftPanelSideEffects } from './left-panel/useLeftPanelSideEffects';
import { SelectedPlace } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
// toast is not used directly in this refactored version, it's used by sub-hooks.

/**
 * 왼쪽 패널 기능 통합 훅 (Refactored)
 */
export const useLeftPanel = () => {
  // Core Data and Selection Hooks
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();

  // Panel UI State Management (Moved to usePanelState)
  const {
    currentPanel,
    setCurrentPanel,
    showCategoryResult,
    setShowCategoryResult,
  } = usePanelState();
  
  // Input State Management
  const { directInputValues, onDirectInputChange } = useInputState();

  // Keywords and Input Logic (Simplified)
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category as CategoryName, finalKeywords, clearSelection);
      if (clearSelection) {
        // setShowCategoryResult is now from usePanelState
        setShowCategoryResult(category as CategoryName);
      }
    }
  };

  // Place Management
  const placesManagement = useSelectedPlaces(); // This already returns an object

  // Itinerary Management (from useItinerary)
  const { 
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
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
    // showItinerary and setShowItinerary are now part of uiVisibility as well for consistency
  };

  // UI Visibility for Itinerary and Category Results
  const uiVisibility = {
    showItinerary, // from useItinerary
    setShowItinerary, // from useItinerary
    showCategoryResult, // from usePanelState
    setShowCategoryResult, // from usePanelState
  };

  // Category Results Data
  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(
    showCategoryResult, // from usePanelState
    showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
    regionSelection.selectedRegions
  );

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // Action Handlers
  const categoryHandlers = useCategoryHandlers();
  const itineraryHandlers = useItineraryHandlers();
  
  // Specific action handlers that might interact with setCurrentPanel or other states managed here
  const handleActualCategorySelect = (category: string) => {
    // This function was previously named handleCategorySelect but was not setting the selectedCategory state.
    // The original selectedCategory state and its setter were removed as they seemed unused.
    // This now directly calls the categoryHandlers function.
    categoryHandlers.handleCategorySelect(category, refetch);
  };

  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value) // setShowCategoryResult from usePanelState
  );

  // handleConfirmCategoryFromButton was removed as selectedCategory state was removed.
  // The confirmation logic is handled by LeftPanel.tsx's handleConfirmCategory.

  const handleCreateItinerary = useCallback(async () => {
    console.log('[useLeftPanel] handleCreateItinerary 호출됨');
    
    // 로딩 상태 활성화
    setIsGenerating(true);
    console.log('[useLeftPanel] Setting isGenerating to true');
    
    console.log('[useLeftPanel] 여행 날짜 정보:', {
      dates: tripDetails.dates,
      startDatetime: tripDetails.startDatetime,
      endDatetime: tripDetails.endDatetime
    });
    
    try {
      const success = await itineraryHandlers.handleCreateItinerary(
        tripDetails,
        placesManagement.selectedPlaces as SelectedPlace[], 
        placesManagement.prepareSchedulePayload,
        itineraryManagement.generateItinerary, 
        uiVisibility.setShowItinerary, // Pass setShowItinerary
        (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel) // Pass setCurrentPanel
      );
      
      if (success) {
        console.log('[useLeftPanel] 일정 생성 성공. 강제 리렌더링 이벤트 발생');
        // The forceRerender event is dispatched by useScheduleGenerationRunner or useItineraryHandlers
        // and listened to by useLeftPanelSideEffects.
        // A slight delay might still be useful here if direct state changes need to propagate before listener acts.
        setTimeout(() => {
          window.dispatchEvent(new Event('forceRerender'));
        }, 100);
      } else {
        // 실패 시 로딩 상태 해제
        setIsGenerating(false);
        console.log('[useLeftPanel] 일정 생성 실패. isGenerating 상태 해제');
      }
      
      return success;
    } catch (error) {
      console.error('[useLeftPanel] 일정 생성 중 오류:', error);
      // 오류 발생 시 로딩 상태 해제
      setIsGenerating(false);
      console.log('[useLeftPanel] 일정 생성 중 오류 발생. isGenerating 상태 해제');
      return false;
    }
  }, [tripDetails, placesManagement, itineraryHandlers, itineraryManagement.generateItinerary, uiVisibility.setShowItinerary, setCurrentPanel, setIsGenerating]); // setIsGenerating 추가
  
  const handleCloseItinerary = () => {
    itineraryHandlers.handleCloseItinerary(
      uiVisibility.setShowItinerary, 
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
  };

  // Side Effects (Moved to useLeftPanelSideEffects)
  useLeftPanelSideEffects({
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    isGenerating, // isGenerating 전달
    setIsGenerating, // setIsGenerating 전달
  });

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement, // Contains itinerary, selectedItineraryDay, and their setters now too
    handleCreateItinerary,
    currentPanel, // from usePanelState
    isCategoryLoading,
    categoryError,
    categoryResults,
    // handleCategorySelect: handleActualCategorySelect, // Renamed for clarity, if needed by consumers
    // The original 'handleCategorySelect' prop was not used by LeftPanel.
    // It seems onCategoryClick in LeftPanelContent is categorySelection.handleCategoryButtonClick
    handleCloseCategoryResult, // Uses setShowCategoryResult from usePanelState
    // handleConfirmCategory is now primarily LeftPanel.tsx's local handler
    handleCloseItinerary,
    isGenerating, // isGenerating 반환
    setIsGenerating, // setIsGenerating 반환
  };
};
