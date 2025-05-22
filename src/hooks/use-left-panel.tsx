
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
import type { ItineraryManagementState, UiVisibilityState } from '@/types/left-panel/index';

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  const leftPanelState = useLeftPanelState();
  const regionSelection = useRegionSelection();
  const categorySelectionHook = useCategorySelection(); 
  const tripDetailsHookResult = useTripDetails();
  const { directInputValues, onDirectInputChange } = useInputState();
  
  useEventListeners(
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  const placesManagement = useSelectedPlaces();
  const itineraryManagementHook: UseItineraryReturn = useItinerary(); 

  const uiVisibility: UiVisibilityState = {
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    showCategoryResult: leftPanelState.showCategoryResult,
    setShowCategoryResult: leftPanelState.setShowCategoryResult
  };

  // Extend categorySelectionHook with setActiveMiddlePanelCategory if needed
  const extendedCategorySelectionHook = {
    ...categorySelectionHook,
    // Add setActiveMiddlePanelCategory if it doesn't exist
    setActiveMiddlePanelCategory: (category: CategoryName | null) => {
      console.log(`[useLeftPanel] Setting active middle panel category: ${category}`);
      // If the hook doesn't have setActiveMiddlePanelCategory, provide a fallback implementation
      if (categorySelectionHook.setActiveMiddlePanelCategory) {
        categorySelectionHook.setActiveMiddlePanelCategory(category);
      } else {
        // Fallback implementation using the existing hook properties
        if (category === null) {
          // Handle category deselection logic here
          // This likely needs custom implementation
          console.log("[useLeftPanel] Category deselected");
        } else {
          // Handle category selection logic here
          // This can use existing methods if available
          if (categorySelectionHook.handleCategoryClick) {
            categorySelectionHook.handleCategoryClick(category);
          }
        }
      }
    }
  };

  const categoryHandlers = useCategoryHandlers(
    leftPanelState.setShowCategoryResult,
    // Use the extended hook with setActiveMiddlePanelCategory
    extendedCategorySelectionHook.setActiveMiddlePanelCategory
  );
  
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
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
  
  // Create an adapter for handleServerItineraryResponse that matches the expected signature
  const adaptedHandleServerItineraryResponse = (parsedItinerary: ItineraryDay[]) => {
    // Call the original function with the parsed itinerary
    // The original function expects more parameters, but we'll ignore them
    if (itineraryManagementHook.handleServerItineraryResponse) {
      itineraryManagementHook.handleServerItineraryResponse(
        parsedItinerary
      );
    }
  };
  
  const itineraryManagementState: ItineraryManagementState = {
    itinerary: itineraryManagementHook.itinerary,
    selectedItineraryDay: itineraryManagementHook.selectedItineraryDay,
    handleSelectItineraryDay: itineraryManagementHook.handleSelectItineraryDay,
    isItineraryCreated: itineraryManagementHook.isItineraryCreated,
    showItinerary: itineraryManagementHook.showItinerary,
    setShowItinerary: itineraryManagementHook.setShowItinerary,
    setItinerary: itineraryManagementHook.setItinerary,
    handleServerItineraryResponse: adaptedHandleServerItineraryResponse,
  };

  return {
    regionSelection,
    categorySelection: extendedCategorySelectionHook,
    keywordsAndInputs,
    placesManagement,
    tripDetails: tripDetailsHookResult,
    uiVisibility,
    itineraryManagement: itineraryManagementState,
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    categoryResultHandlers,
    categoryHandlers,
    isGeneratingItinerary: leftPanelState.isGenerating, 
    itineraryReceived: leftPanelState.itineraryReceived,
  };
};
