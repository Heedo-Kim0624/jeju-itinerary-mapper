
import { useEffect, useCallback } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary, UseItineraryReturn } from './use-itinerary';
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
import type { ItineraryManagementState, UiVisibilityState } from '@/types/left-panel/index'; // Corrected import path

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  const leftPanelState = useLeftPanelState();
  const regionSelection = useRegionSelection();
  const categorySelectionHook = useCategorySelection(); // Renamed to avoid conflict
  const tripDetailsHookResult = useTripDetails();
  const { directInputValues, onDirectInputChange } = useInputState();
  
  useEventListeners(
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  const placesManagement = useSelectedPlaces();
  const itineraryManagementHook: UseItineraryReturn = useItinerary(); 

  const uiVisibility: UiVisibilityState = { // Ensure it matches UiVisibilityState
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    showCategoryResult: leftPanelState.showCategoryResult,
    setShowCategoryResult: leftPanelState.setShowCategoryResult
  };

  const categoryHandlers = useCategoryHandlers(
    leftPanelState.setShowCategoryResult,
    // Pass setActiveMiddlePanelCategory from categorySelectionHook
    categorySelectionHook.setActiveMiddlePanelCategory 
  );
  
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    // handleConfirmCategory is usually part of categorySelectionHook or general callbacks
    // For now, let's assume it's correctly handled by categorySelectionHook.handleConfirmCategory
  };

  const categoryResultHandlers = useCategoryResultHandlers(
    regionSelection.selectedRegions,
    tripDetailsHookResult,
    placesManagement.handleAutoCompletePlaces,
    leftPanelState.setShowCategoryResult
  );

  const generateItineraryAdapter = useCallback(async (
    payloadForServer?: SchedulePayload, 
  ): Promise<ItineraryDay[] | null> => {
    if (!tripDetailsHookResult.dates?.startDate || !tripDetailsHookResult.dates?.endDate) {
      console.error("[Adapter] Trip start or end date is missing.");
      toast.error("여행 시작일 또는 종료일이 설정되지 않았습니다.");
      return null;
    }

    const allPlacesForGeneration: Place[] = [
      ...placesManagement.selectedPlaces,
    ];
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
    
    return itineraryManagementHook.generateItinerary(
      allPlacesForGeneration,
      tripDetailsHookResult.dates.startDate,
      tripDetailsHookResult.dates.endDate,
      tripDetailsHookResult.dates.startTime,
      tripDetailsHookResult.dates.endTime,
      payloadForServer 
    );
  }, [itineraryManagementHook, placesManagement.selectedPlaces, placesManagement.candidatePlaces, tripDetailsHookResult]);

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
    // handleServerItineraryResponse is NOT part of useItineraryCreation props.
    // It's called by useScheduleGenerationRunner which is used by generateItineraryAdapter.
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
      ? categorySelectionHook.selectedKeywordsByCategory[uiVisibility.showCategoryResult] || [] 
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
    setItinerary: itineraryManagementHook.setItinerary,
    handleServerItineraryResponse: itineraryManagementHook.handleServerItineraryResponse,
  };

  return {
    regionSelection,
    categorySelection: categorySelectionHook, // Return the entire hook result
    keywordsAndInputs, // Contains directInputValues and onDirectInputChange
    placesManagement,
    tripDetails: tripDetailsHookResult,
    uiVisibility,
    itineraryManagement: itineraryManagementState,
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    // selectedCategory: leftPanelState.selectedCategory, // This seems legacy
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    categoryResultHandlers, 
    // handleCategorySelect is now part of categoryHandlers, which useCategoryHandlers provides
    // The call site will use categoryHandlers.handleCategorySelect(categoryName, refetchCallback)
    // So, we expose categoryHandlers
    categoryHandlers, // Expose the handlers object which contains handleCategorySelect
    isGeneratingItinerary: leftPanelState.isGenerating, 
    itineraryReceived: leftPanelState.itineraryReceived,
  };
};
