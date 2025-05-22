import { useEffect, useCallback } from 'react'; // useCallback 추가
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
import { SchedulePayload, Place, ItineraryDay, CategoryName } from '@/types/core'; // Place, ItineraryDay, CategoryName 임포트 추가
import { toast } from 'sonner'; // toast 임포트 추가

/**
 * 왼쪽 패널 기능 통합 훅
 * Main hook that composes all left panel functionality
 */
export const useLeftPanel = () => {
  // Core state management
  const leftPanelState = useLeftPanelState(); // Returns showCategoryResult as core CategoryName | null
  const regionSelection = useRegionSelection();
  const categorySelectionHook = useCategorySelection(); // Renamed to avoid conflict
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
  const itineraryManagementHook = useItinerary(); // Renamed for clarity

  // UI visibility
  const uiVisibility = {
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    // This showCategoryResult is CategoryName (core) | null from useLeftPanelState
    showCategoryResult: leftPanelState.showCategoryResult, 
    // This setShowCategoryResult expects CategoryName (core) | null
    setShowCategoryResult: leftPanelState.setShowCategoryResult 
  };

  // Category handlers
  const categoryHandlers = useCategoryHandlers();
  
  // Keyword and input management
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      // categorySelectionHook.handleConfirmCategory expects its own CategoryName, might need adjustment if different
      // For now, assuming it can handle the core CategoryName or casting is appropriate.
      categorySelectionHook.handleConfirmCategory(category as any, finalKeywords, clearSelection);
      if (clearSelection) {
        leftPanelState.setShowCategoryResult(category as any); // 타입 캐스팅으로 처리
      }
    }
  };

  // Category result handlers
  const categoryResultHandlers = useCategoryResultHandlers(
    regionSelection.selectedRegions,
    tripDetailsHookResult,
    placesManagement.handleAutoCompletePlaces,
    leftPanelState.setShowCategoryResult // This expects core CategoryName
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
    leftPanelState.showCategoryResult, // This is core CategoryName | null
    // Ensure selectedKeywordsByCategory uses core CategoryName as key, or adapt access
    leftPanelState.showCategoryResult 
      ? categorySelectionHook.selectedKeywordsByCategory[leftPanelState.showCategoryResult as any] || [] 
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
    categorySelection: categorySelectionHook, // Return the renamed hook
    keywordsAndInputs,
    placesManagement,
    tripDetails: tripDetailsHookResult,
    uiVisibility, // This now provides showCategoryResult as core CategoryName
    itineraryManagement: { // Ensure this object has all needed properties
      itinerary: itineraryManagementHook.itinerary,
      selectedItineraryDay: itineraryManagementHook.selectedItineraryDay,
      handleSelectItineraryDay: itineraryManagementHook.handleSelectItineraryDay,
      isItineraryCreated: itineraryManagementHook.isItineraryCreated,
      handleServerItineraryResponse: itineraryManagementHook.handleServerItineraryResponse, // Ensure this exists on itineraryHook
      showItinerary: itineraryManagementHook.showItinerary,
      setShowItinerary: itineraryManagementHook.setShowItinerary,
    },
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    selectedCategory: leftPanelState.selectedCategory, // This is core CategoryName | null
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    categoryResultHandlers, 
    // Ensure handleCategorySelect from categoryHandlers can accept the right type
    handleCategorySelect: (category: string) => 
      categoryHandlers.handleCategorySelect(category as any, refetch),
    isGeneratingItinerary: leftPanelState.isGenerating,
    itineraryReceived: leftPanelState.itineraryReceived,
  };
};
