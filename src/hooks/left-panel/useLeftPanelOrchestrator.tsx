import { useEffect, useCallback, useMemo } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { useCreateItineraryHandler } from '@/hooks/left-panel/useCreateItineraryHandler';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';
import type { ItineraryDay, CategoryName } from '@/types';
import type { 
  LeftPanelPropsData, 
  ItineraryManagementState, 
  LeftPanelProps, 
  LeftPanelDisplayLogicProps, 
  LeftPanelContentProps, 
  DevDebugInfoProps, 
  CategoryResultHandlerProps 
} from '@/types/left-panel';

export const useLeftPanelOrchestrator = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary: initiateItineraryCreation,
    handleCloseItinerary: closeItineraryPanel,
    categoryResultHandlers,
    currentPanel,
    isGeneratingItinerary: isGeneratingFromCoreHook,
  } = useLeftPanel();

  const { runScheduleGeneration, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();

  const {
    createItinerary,
    isCreatingItinerary: isCreatingFromCustomHook,
  } = useCreateItineraryHandler({
    placesManagement,
    tripDetails,
    runScheduleGeneration,
  });

  const isActuallyGenerating = isGeneratingFromCoreHook || isRunnerGenerating || isCreatingFromCustomHook;

  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack,
    handleCloseItinerary: closeItineraryPanel,
    setRegionSlidePanelOpen: regionSelection.setRegionSlidePanelOpen,
    selectedRegions: regionSelection.selectedRegions,
    setRegionConfirmed: regionSelection.setRegionConfirmed,
    handleCreateItinerary: initiateItineraryCreation,
  });

  const leftPanelPropsData: LeftPanelPropsData = {
    uiVisibility,
    currentPanel,
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement,
    tripDetails,
    placesManagement,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary: closeItineraryPanel,
    regionSelection,
    onConfirmCategoryCallbacks: callbacks.onConfirmCategoryCallbacks,
    handlePanelBackCallbacks: callbacks.handlePanelBackCallbacks,
  };

  const {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps,
  } = useLeftPanelProps(leftPanelPropsData);

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

  const shouldShowItineraryView = useMemo(() => 
    uiVisibility.showItinerary &&
    itineraryManagement.isItineraryCreated &&
    itineraryManagement.itinerary &&
    itineraryManagement.itinerary.length > 0,
  [uiVisibility.showItinerary, itineraryManagement.isItineraryCreated, itineraryManagement.itinerary]);

  useEffect(() => {
    console.log("LeftPanelOrchestrator - ItineraryView 표시 결정 로직:", {
      showItineraryFromUiVisibility: uiVisibility.showItinerary,
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
    uiVisibility.showItinerary,
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
    const success = await initiateItineraryCreation();
    if (success) {
      console.log("[LeftPanelOrchestrator] Itinerary creation process initiated successfully.");
    } else {
      console.log("[LeftPanelOrchestrator] Itinerary creation process failed to initiate or was aborted.");
    }
  }, [isActuallyGenerating, initiateItineraryCreation]);

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
