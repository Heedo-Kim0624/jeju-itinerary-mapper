import { useEffect, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { useCreateItineraryHandler } from '@/hooks/left-panel/useCreateItineraryHandler';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';
import type { ItineraryDay, Place, SelectedPlace, CategoryName } from '@/types/core';

export const useLeftPanelOrchestrator = () => {
  const leftPanelCore = useLeftPanel(); // Get all returns from useLeftPanel
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCloseItinerary: handleCloseItineraryFromCore,
    categoryResultHandlers,
    currentPanel,
    isGeneratingItinerary: isGeneratingFromCoreHook,
  } = leftPanelCore;

  // Destructure specific parts from leftPanelCore to match expected structures
  const categorySelection = leftPanelCore.categorySelection;
  const placesManagement = leftPanelCore.placesManagement;
  const uiVisibility = leftPanelCore.uiVisibility;
  const itineraryManagement = leftPanelCore.itineraryManagement;

  const { runScheduleGeneration, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();

  const {
    createItinerary,
    isCreatingItinerary: isCreatingFromCustomHook,
  } = useCreateItineraryHandler({
    placesManagement: { // Adapt to what useCreateItineraryHandler expects
        selectedPlaces: placesManagement.selectedPlaces as Place[], // Cast if necessary
        candidatePlaces: placesManagement.candidatePlaces as Place[], // Cast if necessary
    },
    tripDetails: {
        dates: tripDetails.dates,
        startDatetime: tripDetails.startDatetime,
        endDatetime: tripDetails.endDatetime,
    },
    runScheduleGeneration,
  });

  const isActuallyGenerating = isGeneratingFromCoreHook || isRunnerGenerating || isCreatingFromCustomHook;

  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack,
    handleCloseItinerary: handleCloseItineraryFromCore,
    setRegionSlidePanelOpen: regionSelection.setRegionSlidePanelOpen,
    selectedRegions: regionSelection.selectedRegions,
    setRegionConfirmed: regionSelection.setRegionConfirmed,
    handleCreateItinerary: createItinerary,
  });

  const {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps,
  } = useLeftPanelProps({
    uiVisibility: { // Adapt uiVisibility to what useLeftPanelProps expects
        showItinerary: uiVisibility.showItinerary,
        setShowItinerary: uiVisibility.setShowItinerary, // This should be (show: boolean) => void
        showCategoryResult: uiVisibility.showCategoryResult as CategoryName | null, // Use core CategoryName
        setShowCategoryResult: uiVisibility.setShowCategoryResult as (category: CategoryName | null) => void, // Use core CategoryName
    },
    currentPanel,
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement: { // Adapt itineraryManagement
        ...itineraryManagement,
        itinerary: itineraryManagement.itinerary || [],
        selectedItineraryDay: itineraryManagement.selectedItineraryDay || 0,
    },
    tripDetails,
    placesManagement: { // Adapt placesManagement
        ...placesManagement,
        selectedPlaces: placesManagement.selectedPlaces || [],
        allFetchedPlaces: [], // Provide default if not available
    },
    categorySelection: { // Adapt categorySelection
        ...categorySelection,
        currentCategoryPanel: categorySelection.currentCategoryPanel || null,
        selectedCategory: categorySelection.selectedCategory || null,
    },
    keywordsAndInputs: { // Adapt keywordsAndInputs
        ...keywordsAndInputs,
        currentCategory: keywordsAndInputs.currentCategory || null,
        selectedKeywords: keywordsAndInputs.selectedKeywords || [],
    },
    categoryResultHandlers, // This should be fine
    handleCloseItinerary: handleCloseItineraryFromCore, // This should be fine
    regionSelection: { // Adapt regionSelection
        ...regionSelection,
        selectedRegions: regionSelection.selectedRegions || [],
    },
    onConfirmCategoryCallbacks: callbacks.onConfirmCategoryCallbacks,
    handlePanelBackCallbacks: callbacks.handlePanelBackCallbacks,
  });

  useEffect(() => {
    console.log("LeftPanelOrchestrator - 일정 관련 상태 변화 감지:", {
      showItineraryFromHook: uiVisibility.showItinerary,
      selectedItineraryDayFromHook: itineraryManagement.selectedItineraryDay,
      itineraryFromHookSummary: summarizeItineraryData(itineraryManagement.itinerary),
      isCreatingItineraryPanelState: isCreatingFromCustomHook,
      isRunnerGeneratingState: isRunnerGenerating,
      isGeneratingFromCoreHook: isGeneratingFromCoreHook,
      isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated,
    });
  }, [
    uiVisibility.showItinerary,
    itineraryManagement.selectedItineraryDay,
    itineraryManagement.itinerary,
    isCreatingFromCustomHook,
    isRunnerGenerating,
    isGeneratingFromCoreHook,
    itineraryManagement.isItineraryCreated,
  ]);

  const shouldShowItineraryView =
    itineraryManagement.showItinerary &&
    itineraryManagement.isItineraryCreated &&
    itineraryManagement.itinerary &&
    itineraryManagement.itinerary.length > 0;

  useEffect(() => {
    console.log("LeftPanelOrchestrator - ItineraryView 표시 결정 로직:", {
      showItineraryFromItineraryMgmt: itineraryManagement.showItinerary,
      isItineraryCreatedFromItineraryMgmt: itineraryManagement.isItineraryCreated,
      isCreatingItineraryPanelState: isCreatingFromCustomHook,
      isRunnerGeneratingState: isRunnerGenerating,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView,
    });

    if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && itineraryManagement.itinerary.every(day => day.places.length === 0)) {
      console.warn("LeftPanelOrchestrator - 일정은 있지만 모든 일자에 장소가 없습니다:", summarizeItineraryData(itineraryManagement.itinerary));
    }
  }, [
    itineraryManagement.showItinerary,
    itineraryManagement.isItineraryCreated,
    itineraryManagement.itinerary,
    isCreatingFromCustomHook,
    isRunnerGenerating,
    shouldShowItineraryView,
  ]);

  const handleTriggerCreateItinerary = useCallback(async () => {
    if (isActuallyGenerating) {
      toast.info("일정 생성 중입니다. 잠시만 기다려주세요.");
      return;
    }
    const result = await createItinerary();
    if (result) {
      console.log("[LeftPanelOrchestrator] Itinerary creation process finished via custom hook.");
      // After successful creation, ensure the itinerary is set in the main state
      if (itineraryManagement.setItinerary) {
        itineraryManagement.setItinerary(result);
      }
      if (itineraryManagement.setIsItineraryCreated) {
        itineraryManagement.setIsItineraryCreated(true);
      }
      if (itineraryManagement.setShowItinerary) {
        itineraryManagement.setShowItinerary(true);
      }
    } else {
      console.log("[LeftPanelOrchestrator] Itinerary creation process did not produce a result or was aborted.");
    }
  }, [isActuallyGenerating, createItinerary, itineraryManagement]);

  const enhancedItineraryDisplayProps = itineraryDisplayProps
    ? {
        ...itineraryDisplayProps,
        handleClosePanelWithBackButton: callbacks.handleClosePanelWithBackButton,
      }
    : null;

  const enhancedMainPanelProps = mainPanelProps
    ? {
        leftPanelContainerProps: {
          ...mainPanelProps.leftPanelContainerProps,
          onCreateItinerary: handleTriggerCreateItinerary,
        },
        leftPanelContentProps: mainPanelProps.leftPanelContentProps,
      }
    : null;

  return {
    regionSelection,
    uiVisibility,
    categorySelection,
    placesManagement,
    callbacks,
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
    devDebugInfoProps,
    categoryResultHandlers,
    itineraryData: itineraryManagement.itinerary,
    selectedDayForDisplay: itineraryManagement.selectedItineraryDay,
    handleDaySelect: itineraryManagement.handleSelectItineraryDay,
    handleCloseItineraryPanel: handleCloseItineraryFromCore,
  };
};
