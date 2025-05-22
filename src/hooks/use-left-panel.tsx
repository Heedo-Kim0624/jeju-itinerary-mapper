import { useEffect, useCallback } from 'react'; 
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useInputState } from './left-panel/use-input-state';
import { useLeftPanelState } from './left-panel/use-left-panel-state';
import { useItineraryCreation } from './left-panel/use-itinerary-creation';
import { useCategoryResultHandlers } from './left-panel/use-category-result-handlers';
import { useEventListeners } from './left-panel/use-event-listeners';
import type { SchedulePayload, Place, ItineraryDay, CategoryName } from '@/types/core';
import { toast } from 'sonner';

/**
 * 왼쪽 패널 기능 통합 훅
 * Main hook that composes all left panel functionality
 */
export const useLeftPanel = () => {
  // Core state management
  const leftPanelState = useLeftPanelState();
  const regionSelection = useRegionSelection();
  const categorySelectionHookResult = useCategorySelection(); // Renamed to avoid conflict
  const tripDetailsHookResult = useTripDetails();
  const { directInputValues, onDirectInputChange } = useInputState();
  
  // Set up event listeners
  useEventListeners(
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  // Place management
  const placesManagement = useSelectedPlaces();

  // Itinerary management
  const itineraryManagementHook = useItinerary();

  // UI visibility
  const uiVisibility = {
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    showCategoryResult: leftPanelState.showCategoryResult,
    setShowCategoryResult: leftPanelState.setShowCategoryResult
  };

  // Add missing setActiveMiddlePanelCategory to categorySelection
  const categorySelection = { // Renamed from enhancedCategorySelection
    ...categorySelectionHookResult,
    setActiveMiddlePanelCategory: (category: CategoryName | null) => {
      // useLeftPanelState 훅에서는 setActiveMiddlePanelCategory가 아닌 
      // setSelectedCategory 프로퍼티를 사용해야 합니다.
      leftPanelState.setSelectedCategory(category as string);
    },
    // Make sure handlePanelBack is correctly implemented with () => void signature
    handlePanelBack: () => { // Removed 'category: string' parameter
      // setActiveMiddlePanelCategory가 아닌 setSelectedCategory로 수정
      leftPanelState.setSelectedCategory(null);
    }
  };
  
  // Category handlers
  const categoryHandlers = useCategoryHandlers();
  
  // Keyword and input management
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelectionHookResult.handleConfirmCategory(category as any, finalKeywords, clearSelection); // Use original hook result
      if (clearSelection) {
        leftPanelState.setShowCategoryResult(category as any);
      }
    }
  };

  // Category result handlers
  const categoryResultHandlers = useCategoryResultHandlers(
    regionSelection.selectedRegions,
    tripDetailsHookResult,
    placesManagement.handleAutoCompletePlaces,
    leftPanelState.setShowCategoryResult
  );

  // Adapter function for generateItinerary
  const generateItineraryAdapter = useCallback(async (payload: SchedulePayload): Promise<ItineraryDay[] | null> => {
    if (!tripDetailsHookResult.dates.startDate || !tripDetailsHookResult.dates.endDate) {
      console.error("[Adapter] Trip start or end date is missing in tripDetails.dates.");
      toast.error("여행 시작일 또는 종료일이 설정되지 않았습니다.");
      return null;
    }

    const placesForClientGenerator: Place[] = [
      ...(placesManagement.selectedPlaces as Place[]),
      ...(placesManagement.candidatePlaces as Place[]),
    ];

    if (placesForClientGenerator.length === 0) {
        toast.info("일정을 생성할 장소가 선택되지 않았습니다. (Adapter)");
        return null;
    }

    try {
      return await itineraryManagementHook.generateItinerary(
        placesForClientGenerator,
        tripDetailsHookResult.dates.startDate,
        tripDetailsHookResult.dates.endDate,
        tripDetailsHookResult.startTime,
        tripDetailsHookResult.endTime
      );
    } catch (error) {
      console.error("일정 생성 어댑터에서 오류:", error);
      toast.error(`어댑터에서 일정 생성 중 오류: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, [itineraryManagementHook, placesManagement, tripDetailsHookResult]);

  // Fix the handleServerItineraryResponse implementation
  const enhancedItineraryManagementHook = {
    ...itineraryManagementHook,
    handleServerItineraryResponse: (itinerary: ItineraryDay[]) => {
      // Implement a proper logic to handle server itinerary response
      if (itinerary && itinerary.length > 0) {
        itineraryManagementHook.setItinerary(itinerary);
        itineraryManagementHook.setIsItineraryCreated(true);
        return itinerary;
      } else {
        console.warn("Empty or invalid itinerary received");
        itineraryManagementHook.setItinerary([]); // Ensure itinerary is set to empty array
        itineraryManagementHook.setIsItineraryCreated(false); // Ensure created status is false
        return [];
      }
    }
  };

  // Itinerary creation logic
  const itineraryCreation = useItineraryCreation({
    tripDetails: tripDetailsHookResult,
    userDirectlySelectedPlaces: placesManagement.selectedPlaces,
    autoCompleteCandidatePlaces: placesManagement.candidatePlaces,
    prepareSchedulePayload: placesManagement.prepareSchedulePayload,
    generateItinerary: generateItineraryAdapter,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    setCurrentPanel: leftPanelState.setCurrentPanel,
    setIsGenerating: leftPanelState.setIsGenerating,
    setItineraryReceived: leftPanelState.setItineraryReceived,
  });

  // Category results from API
  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(
    leftPanelState.showCategoryResult, 
    leftPanelState.showCategoryResult 
      ? categorySelectionHookResult.selectedKeywordsByCategory[leftPanelState.showCategoryResult] || []  // Use original hook result
      : [], 
    regionSelection.selectedRegions
  );

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // Handle panel navigation and view changes based on itinerary state
  useEffect(() => {
    if (itineraryManagementHook.isItineraryCreated && itineraryManagementHook.itinerary && itineraryManagementHook.itinerary.length > 0) {
      if (!uiVisibility.showItinerary) {
         console.log("useLeftPanel: Itinerary created, ensuring panel is visible.");
         uiVisibility.setShowItinerary(true);
      }
      if (leftPanelState.currentPanel !== 'itinerary') {
        leftPanelState.setCurrentPanel('itinerary');
      }
    }
  }, [
    itineraryManagementHook.isItineraryCreated, 
    itineraryManagementHook.itinerary, 
    uiVisibility.showItinerary, 
    leftPanelState.currentPanel,
    leftPanelState.setCurrentPanel,
    uiVisibility.setShowItinerary
  ]);

  // Combine and return all necessary functionality
  return {
    regionSelection,
    categorySelection, // Return the enhanced version
    keywordsAndInputs,
    placesManagement,
    tripDetails: tripDetailsHookResult,
    uiVisibility,
    itineraryManagement: { 
      itinerary: itineraryManagementHook.itinerary,
      selectedItineraryDay: itineraryManagementHook.selectedItineraryDay,
      handleSelectItineraryDay: itineraryManagementHook.handleSelectItineraryDay,
      isItineraryCreated: itineraryManagementHook.isItineraryCreated,
      handleServerItineraryResponse: enhancedItineraryManagementHook.handleServerItineraryResponse,
      showItinerary: itineraryManagementHook.showItinerary,
      setShowItinerary: itineraryManagementHook.setShowItinerary,
    },
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    selectedCategory: leftPanelState.selectedCategory,
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    categoryResultHandlers, 
    handleCategorySelect: (category: string) => 
      categoryHandlers.handleCategorySelect(category, refetch),
    isGeneratingItinerary: leftPanelState.isGenerating,
    itineraryReceived: leftPanelState.itineraryReceived,
  };
};
