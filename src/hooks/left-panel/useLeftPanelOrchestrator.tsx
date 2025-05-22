
import { useEffect, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { useCreateItineraryHandler } from '@/hooks/left-panel/useCreateItineraryHandler';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';
import type { ItineraryDay } from '@/types';
import type { CategoryName } from '@/utils/categoryUtils';

export const useLeftPanelOrchestrator = () => {
  const leftPanelCore = useLeftPanel();
  
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCloseItinerary,
    categoryResultHandlers,
    currentPanel,
    isGeneratingItinerary: isGeneratingFromCoreHook,
  } = leftPanelCore;

  const { runScheduleGeneration, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();

  const {
    createItinerary,
    isCreatingItinerary: isCreatingFromCustomHook,
  } = useCreateItineraryHandler({
    placesManagement,
    tripDetails: {
      ...tripDetails,
      // Add missing handleDateChange property
      handleDateChange: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string }) => {
        tripDetails.setDates(dates);
      }
    },
    runScheduleGeneration,
  });

  // Create adapter for placesManagement to match expected types
  const adaptedPlacesManagement = {
    ...placesManagement,
    handleAutoCompletePlaces: (category: CategoryName, placesFromApi: any[], keywords: string[]) => {
      // Adapter function - convert parameters as needed
      const travelDays = keywords ? keywords.length : null; // Adapting keywords to travelDays
      placesManagement.handleAutoCompletePlaces(category, placesFromApi, travelDays);
    }
  };

  const isActuallyGenerating = isGeneratingFromCoreHook || isRunnerGenerating || isCreatingFromCustomHook;

  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack,
    handleCloseItinerary,
    setRegionSlidePanelOpen: regionSelection.setRegionSlidePanelOpen,
    selectedRegions: regionSelection.selectedRegions,
    setRegionConfirmed: regionSelection.setRegionConfirmed,
    handleCreateItinerary: createItinerary, 
  });

  // Create a type-safe version of currentPanel
  const typedCurrentPanel = (
    currentPanel === 'region' || 
    currentPanel === 'date' || 
    currentPanel === 'category' || 
    currentPanel === 'itinerary'
  ) ? currentPanel : 'category' as const;

  const {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps,
  } = useLeftPanelProps({
    uiVisibility,
    currentPanel: typedCurrentPanel, // Pass typed version
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement: itineraryManagement,
    tripDetails,
    placesManagement: adaptedPlacesManagement, // Pass adapted version
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary,
    regionSelection,
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
    } else {
      console.log("[LeftPanelOrchestrator] Itinerary creation process did not produce a result or was aborted.");
    }
  }, [isActuallyGenerating, createItinerary]);

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
  };
};
