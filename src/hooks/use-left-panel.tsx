
import { useEffect, useCallback } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary, UseItineraryReturn } from './use-itinerary'; // Import UseItineraryReturn
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useInputState } from './left-panel/use-input-state';
import { useLeftPanelState } from './left-panel/use-left-panel-state';
import { useItineraryCreation } from './left-panel/use-itinerary-creation'; 
import { useCategoryResultHandlers } from './left-panel/use-category-result-handlers';
import { useEventListeners } from './left-panel/use-event-listeners';
import { SchedulePayload, Place, ItineraryDay, CategoryName } from '@/types/core';
import { toast } from 'sonner';
import type { ItineraryManagementState } from '@/types/left-panel'; // Import the state type

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  const leftPanelState = useLeftPanelState();
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetailsHookResult = useTripDetails();
  const { directInputValues, onDirectInputChange } = useInputState();
  
  useEventListeners(
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  const placesManagement = useSelectedPlaces();
  const itineraryManagementHook: UseItineraryReturn = useItinerary(); // Use the specific return type

  const uiVisibility = {
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    showCategoryResult: leftPanelState.showCategoryResult,
    setShowCategoryResult: leftPanelState.setShowCategoryResult
  };

  const categoryHandlers = useCategoryHandlers(
    leftPanelState.setShowCategoryResult,
    categorySelection.setActiveMiddlePanelCategory
  );
  
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: CategoryName, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category, finalKeywords, clearSelection);
      // If direct input was used, show results panel, otherwise category panel handles it
      if (clearSelection) { // Assuming clearSelection means direct input confirm
        leftPanelState.setShowCategoryResult(category);
      }
    }
  };

  const categoryResultHandlers = useCategoryResultHandlers(
    regionSelection.selectedRegions,
    tripDetailsHookResult,
    placesManagement.handleAutoCompletePlaces,
    leftPanelState.setShowCategoryResult
  );

  const generateItineraryAdapter = useCallback(async (
    // This adapter is called by useItineraryCreation's handleInitiateItineraryCreation
    // which then calls runScheduleGeneration (from useScheduleGenerationRunner)
    // or useItineraryActions.generateItinerary
    payloadForServer?: SchedulePayload, // This might be for server
  ): Promise<ItineraryDay[] | null> => {
    if (!tripDetailsHookResult.dates?.startDate || !tripDetailsHookResult.dates?.endDate) {
      console.error("[Adapter] Trip start or end date is missing.");
      toast.error("여행 시작일 또는 종료일이 설정되지 않았습니다.");
      return null;
    }

    const allPlacesForGeneration: Place[] = [
      ...placesManagement.selectedPlaces,
      // Candidate places might also be included depending on strategy
      // For now, focusing on user-selected places for generateItinerary call
    ];
     // Add unique candidate places
    const selectedPlaceIds = new Set(placesManagement.selectedPlaces.map(p => String(p.id)));
    placesManagement.candidatePlaces.forEach(p => {
        if (!selectedPlaceIds.has(String(p.id))) {
            allPlacesForGeneration.push(p);
        }
    });


    if (allPlacesForGeneration.length === 0) {
        toast.info("일정을 생성할 장소가 선택되지 않았습니다. (Adapter)");
        return null;
    }
    
    // itineraryManagementHook.generateItinerary is the unified function from useItineraryActions
    return itineraryManagementHook.generateItinerary(
      allPlacesForGeneration,
      tripDetailsHookResult.dates.startDate,
      tripDetailsHookResult.dates.endDate,
      tripDetailsHookResult.dates.startTime,
      tripDetailsHookResult.dates.endTime,
      payloadForServer // Pass payload if available for server-side generation
    );
  }, [itineraryManagementHook, placesManagement.selectedPlaces, placesManagement.candidatePlaces, tripDetailsHookResult]);

  const itineraryCreation = useItineraryCreation({
    tripDetails: tripDetailsHookResult,
    userDirectlySelectedPlaces: placesManagement.selectedPlaces,
    autoCompleteCandidatePlaces: placesManagement.candidatePlaces,
    prepareSchedulePayload: placesManagement.prepareSchedulePayload, // This creates payload for server
    generateItinerary: generateItineraryAdapter, // This uses the adapter which calls the unified generator
    
    // Callbacks to update UI state
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    setCurrentPanel: leftPanelState.setCurrentPanel,
    setIsGenerating: leftPanelState.setIsGenerating, // For loading indicators
    setItineraryReceived: leftPanelState.setItineraryReceived, // For DevDebugInfo
    // Pass server response handler from itinerary management
    handleServerItineraryResponse: itineraryManagementHook.handleServerItineraryResponse,
  });

  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(
    uiVisibility.showCategoryResult, 
    uiVisibility.showCategoryResult 
      ? categorySelection.selectedKeywordsByCategory[uiVisibility.showCategoryResult] || [] 
      : [], 
    regionSelection.selectedRegions
  );

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

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
  
  const itineraryManagementState: ItineraryManagementState = {
    itinerary: itineraryManagementHook.itinerary,
    selectedItineraryDay: itineraryManagementHook.selectedItineraryDay,
    handleSelectItineraryDay: itineraryManagementHook.handleSelectItineraryDay,
    isItineraryCreated: itineraryManagementHook.isItineraryCreated,
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    setItinerary: itineraryManagementHook.setItinerary, // Ensure setItinerary is included
    handleServerItineraryResponse: itineraryManagementHook.handleServerItineraryResponse,
  };

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails: tripDetailsHookResult,
    uiVisibility,
    itineraryManagement: itineraryManagementState, // Use the typed object
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    selectedCategory: leftPanelState.selectedCategory, // This seems to be from old state logic
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    categoryResultHandlers, 
    handleCategorySelect: (category: CategoryName) => 
      categoryHandlers.handleCategorySelect(category, refetch), // Pass refetch to category handler
    isGeneratingItinerary: leftPanelState.isGenerating, // Centralized loading state
    itineraryReceived: leftPanelState.itineraryReceived,
  };
};

