
import React, { useEffect, useState, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { useCreateItineraryHandler } from '@/hooks/left-panel/useCreateItineraryHandler'; // 새로 추가된 훅
import { toast } from 'sonner';
import type { ItineraryDay } from '@/types'; // Place, CoreSelectedPlace, SchedulePayload 는 useCreateItineraryHandler 로 이동
import { summarizeItineraryData } from '@/utils/debugUtils';

const LeftPanel: React.FC = () => {
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
  } = useLeftPanel();

  const { runScheduleGeneration, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();

  const { 
    createItinerary, 
    isCreatingItinerary: isCreatingFromCustomHook 
  } = useCreateItineraryHandler({
    placesManagement,
    tripDetails,
    runScheduleGeneration,
  });
  
  const isActuallyGenerating = isGeneratingFromCoreHook || isRunnerGenerating || isCreatingFromCustomHook;

  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack,
    handleCloseItinerary,
    setRegionSlidePanelOpen: regionSelection.setRegionSlidePanelOpen,
    selectedRegions: regionSelection.selectedRegions,
    setRegionConfirmed: regionSelection.setRegionConfirmed,
    // handleCreateItinerary: undefined, //  If LeftPanelCallbacks expects it and we don't provide this specific version from here
  });

  const {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps
  } = useLeftPanelProps({
    uiVisibility,
    currentPanel,
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement: itineraryManagement,
    tripDetails,
    placesManagement,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary,
    regionSelection,
    onConfirmCategoryCallbacks: callbacks.onConfirmCategoryCallbacks,
    handlePanelBackCallbacks: callbacks.handlePanelBackCallbacks,
  });

  // ... useEffect for logging (내용은 동일하므로 생략)
  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지 (Hook states):", {
      showItineraryFromHook: uiVisibility.showItinerary, 
      selectedItineraryDayFromHook: itineraryManagement.selectedItineraryDay,
      itineraryFromHookSummary: summarizeItineraryData(itineraryManagement.itinerary),
      isCreatingItineraryPanelState: isCreatingFromCustomHook, // Updated to use state from new hook
      isRunnerGeneratingState: isRunnerGenerating,
      isGeneratingFromCoreHook: isGeneratingFromCoreHook,
      isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated,
    });
  }, [
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    itineraryManagement.itinerary,
    isCreatingFromCustomHook, // Updated dependency
    isRunnerGenerating,
    isGeneratingFromCoreHook,
    itineraryManagement.isItineraryCreated,
  ]);
  
  const shouldShowItineraryView = 
    itineraryManagement.showItinerary && 
    itineraryManagement.isItineraryCreated && 
    itineraryManagement.itinerary && 
    itineraryManagement.itinerary.length > 0;

  // ... useEffect for logging (내용은 동일하므로 생략)
  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직 (Hook states):", {
      showItineraryFromItineraryMgmt: itineraryManagement.showItinerary,
      isItineraryCreatedFromItineraryMgmt: itineraryManagement.isItineraryCreated,
      isCreatingItineraryPanelState: isCreatingFromCustomHook, // Updated
      isRunnerGeneratingState: isRunnerGenerating,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView
    });
    
    if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && itineraryManagement.itinerary.every(day => day.places.length === 0)) {
      console.warn("LeftPanel - 일정은 있지만 모든 일자에 장소가 없습니다 (useEffect):", summarizeItineraryData(itineraryManagement.itinerary));
    }
  }, [
      itineraryManagement.showItinerary, 
      itineraryManagement.isItineraryCreated, 
      itineraryManagement.itinerary, 
      isCreatingFromCustomHook, // Updated
      isRunnerGenerating,
      shouldShowItineraryView
    ]);

  const handleTriggerCreateItinerary = useCallback(async () => {
    if (isActuallyGenerating) {
      toast.info("일정 생성 중입니다. 잠시만 기다려주세요.");
      return;
    }
    // `createItinerary` from `useCreateItineraryHandler` already has checks for places and dates.
    // It will show toasts if conditions are not met.
    const result = await createItinerary();
    if (result) {
      // Successfully created, useLeftPanel and useItinerary hooks should update state,
      // causing UI to react.
      console.log("[LeftPanel] Itinerary creation process finished via custom hook.");
    } else {
      // Creation failed or was aborted (e.g., no places selected), toasts handled in hook.
      console.log("[LeftPanel] Itinerary creation process did not produce a result or was aborted.");
    }
  }, [isActuallyGenerating, createItinerary]);


  const enhancedItineraryDisplayProps = itineraryDisplayProps
    ? {
        ...itineraryDisplayProps,
        handleClosePanelWithBackButton: callbacks.handleClosePanelWithBackButton
      }
    : null;

  const enhancedMainPanelProps = mainPanelProps
    ? {
        leftPanelContainerProps: {
          ...mainPanelProps.leftPanelContainerProps,
          onCreateItinerary: handleTriggerCreateItinerary // Updated to use the new handler
        },
        leftPanelContentProps: mainPanelProps.leftPanelContentProps
      }
    : null;


  return (
    <div className="relative h-full">
      <LeftPanelDisplayLogic
        isGenerating={isActuallyGenerating}
        shouldShowItineraryView={shouldShowItineraryView}
        itineraryDisplayProps={enhancedItineraryDisplayProps}
        mainPanelProps={enhancedMainPanelProps}
      />

      <RegionPanelHandler
        open={regionSelection.regionSlidePanelOpen}
        onClose={() => regionSelection.setRegionSlidePanelOpen(false)}
        selectedRegions={regionSelection.selectedRegions}
        onToggle={regionSelection.handleRegionToggle}
        onConfirm={callbacks.handleRegionConfirm}
      />

      <CategoryResultHandler
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={categoryResultHandlers.handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete}
      />
      
      <DevDebugInfo {...devDebugInfoProps} />
    </div>
  );
};

export default LeftPanel;
