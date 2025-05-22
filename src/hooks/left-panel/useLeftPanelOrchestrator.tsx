import { useEffect, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { useCreateItineraryHandler } from '@/hooks/left-panel/useCreateItineraryHandler';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { useAdaptedScheduleGenerator } from '@/hooks/left-panel/useAdaptedScheduleGenerator';
import { useItineraryViewDecider } from '@/hooks/left-panel/useItineraryViewDecider';
import { useEnhancedPanelProps } from '@/hooks/left-panel/useEnhancedPanelProps';
import { useMapContext } from '@/components/rightpanel/MapContext'; // 추가: MapContext import
import { toast } from 'sonner';
// import { summarizeItineraryData } from '@/utils/debugUtils'; // Removed as logs using it are removed
import type { ItineraryDay, Place, SchedulePayload } from '@/types';
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

  const { runScheduleGeneration: runScheduleGenerationFromRunner, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();
  const { clearAllRoutes, clearMarkersAndUiElements } = useMapContext(); // 추가: MapContext 에서 clearMarkersAndUiElements 가져오기

  const { adaptedRunScheduleGeneration } = useAdaptedScheduleGenerator({
    runScheduleGenerationFromRunner,
    selectedCorePlaces: placesManagement.selectedPlaces,
    candidateCorePlaces: placesManagement.candidatePlaces,
    tripStartDateFromDetails: tripDetails.dates?.startDate || null,
  });

  const {
    createItinerary,
    isCreatingItinerary: isCreatingFromCustomHook,
  } = useCreateItineraryHandler({
    placesManagement: {
        selectedPlaces: placesManagement.selectedPlaces,
        candidatePlaces: placesManagement.candidatePlaces,
        prepareSchedulePayload: placesManagement.prepareSchedulePayload,
    },
    tripDetails: {
      dates: tripDetails.dates,
      startTime: tripDetails.startTime,
      endTime: tripDetails.endTime,
    },
    runScheduleGeneration: adaptedRunScheduleGeneration,
  });
  
  const { shouldShowItineraryView } = useItineraryViewDecider({
    itineraryManagement: {
      showItinerary: itineraryManagement.showItinerary,
      isItineraryCreated: itineraryManagement.isItineraryCreated,
      itinerary: itineraryManagement.itinerary,
    }
  });

  const adaptedPlacesManagementForProps = {
    ...placesManagement,
    handleAutoCompletePlaces: (category: CategoryName, placesFromApi: any[], keywords: string[]) => {
      const travelDays = keywords ? keywords.length : null; 
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

  const typedCurrentPanel = (
    currentPanel === 'region' || 
    currentPanel === 'date' || 
    currentPanel === 'category' || 
    currentPanel === 'itinerary'
  ) ? currentPanel : 'category' as const;

  const {
    itineraryDisplayProps: baseItineraryDisplayProps,
    mainPanelProps: baseMainPanelProps,
    devDebugInfoProps,
  } = useLeftPanelProps({
    uiVisibility,
    currentPanel: typedCurrentPanel,
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement: itineraryManagement,
    tripDetails,
    placesManagement: adaptedPlacesManagementForProps,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary,
    regionSelection,
    onConfirmCategoryCallbacks: callbacks.onConfirmCategoryCallbacks,
    handlePanelBackCallbacks: callbacks.handlePanelBackCallbacks,
  });

  useEffect(() => {
    // console.log("LeftPanelOrchestrator - 일정 관련 상태 변화 감지:", { // Debug log removed
    //   showItineraryFromHook: uiVisibility.showItinerary,
    //   selectedItineraryDayFromHook: itineraryManagement.selectedItineraryDay,
    //   itineraryFromHookSummary: summarizeItineraryData(itineraryManagement.itinerary),
    //   isCreatingItineraryPanelState: isCreatingFromCustomHook,
    //   isRunnerGeneratingState: isRunnerGenerating,
    //   isGeneratingFromCoreHook: isGeneratingFromCoreHook,
    //   isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated,
    // });
  }, [
    uiVisibility.showItinerary,
    itineraryManagement.selectedItineraryDay,
    itineraryManagement.itinerary,
    isCreatingFromCustomHook,
    isRunnerGenerating,
    isGeneratingFromCoreHook,
    itineraryManagement.isItineraryCreated,
  ]);

  useEffect(() => {
    // console.log("LeftPanelOrchestrator - ItineraryView 표시 결정 로직 (from useItineraryViewDecider):", { // Debug log removed
    //   showItineraryFromItineraryMgmt: itineraryManagement.showItinerary,
    //   isItineraryCreatedFromItineraryMgmt: itineraryManagement.isItineraryCreated,
    //   isCreatingItineraryPanelState: isCreatingFromCustomHook,
    //   isRunnerGeneratingState: isRunnerGenerating,
    //   itineraryExists: !!itineraryManagement.itinerary,
    //   itineraryLength: itineraryManagement.itinerary?.length || 0,
    //   최종결과_shouldShowItineraryView: shouldShowItineraryView,
    // });

    // if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && itineraryManagement.itinerary.every(day => day.places.length === 0)) { // Debug log removed
    //   console.warn("LeftPanelOrchestrator - 일정은 있지만 모든 일자에 장소가 없습니다:", summarizeItineraryData(itineraryManagement.itinerary));
    // }
  }, [
    itineraryManagement.showItinerary,
    itineraryManagement.isItineraryCreated,
    itineraryManagement.itinerary,
    isCreatingFromCustomHook,
    isRunnerGenerating,
    shouldShowItineraryView,
  ]);

  // 변경된 부분: 경로 생성 버튼을 클릭할 때 실행되는 handleTriggerCreateItinerary 함수 수정
  const handleTriggerCreateItinerary = useCallback(async () => {
    if (isActuallyGenerating) {
      toast.info("일정 생성 중입니다. 잠시만 기다려주세요.");
      return;
    }
    
    // 경로 생성 시작 전에 지도의 모든 마커와 UI 요소 제거
    if (clearMarkersAndUiElements) {
      console.log("[useLeftPanelOrchestrator] 경로 생성 시작 전 지도 마커와 UI 요소 제거");
      clearMarkersAndUiElements();
    } else {
      console.warn("[useLeftPanelOrchestrator] clearMarkersAndUiElements 함수를 찾을 수 없습니다.");
    }

    // 기존의 경로도 초기화
    if (clearAllRoutes) {
      console.log("[useLeftPanelOrchestrator] 경로 생성 시작 전 이전 경로 제거");
      clearAllRoutes();
    }
    
    const result = await createItinerary();
    // if (result) { // Debug log removed
    //   console.log("[LeftPanelOrchestrator] Itinerary creation process finished via custom hook.");
    // } else {
    //   console.log("[LeftPanelOrchestrator] Itinerary creation process did not produce a result or was aborted.");
    // }
  }, [isActuallyGenerating, createItinerary, clearMarkersAndUiElements, clearAllRoutes]);

  const {
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
  } = useEnhancedPanelProps({
    itineraryDisplayProps: baseItineraryDisplayProps,
    mainPanelProps: baseMainPanelProps,
    callbacks,
    handleTriggerCreateItinerary,
  });

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
