
import { useEffect, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { useCreateItineraryHandler } from '@/hooks/left-panel/useCreateItineraryHandler';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';
import type { ItineraryDay, Place, SchedulePayload, SelectedPlace } from '@/types';
import type { CategoryName } from '@/utils/categoryUtils';

/**
 * Place 타입을 SelectedPlace 타입으로 변환하는 어댑터 함수
 */
const convertToSelectedPlaces = (places: Place[]): SelectedPlace[] => {
  return places.map(place => ({
    ...place,
    category: place.category as CategoryName, // 여기서 타입 캐스팅을 수행합니다
    isSelected: place.isSelected || false,
    isCandidate: place.isCandidate || false
  }));
};

export const useLeftPanelOrchestrator = () => {
  const leftPanelCore = useLeftPanel();
  
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement, // placesManagement from useLeftPanel returns SelectedPlace[] for selectedPlaces/candidatePlaces
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCloseItinerary,
    categoryResultHandlers,
    currentPanel,
    isGeneratingItinerary: isGeneratingFromCoreHook,
  } = leftPanelCore;

  // runScheduleGenerationFromRunner로 이름 변경하여 원래 함수 참조
  const { runScheduleGeneration: runScheduleGenerationFromRunner, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();

  // runScheduleGenerationFromRunner를 위한 어댑터 함수
  const adaptedRunScheduleGeneration = useCallback(async (payload: SchedulePayload): Promise<ItineraryDay[] | null> => {
    const allPlacesForRunner = [
      ...placesManagement.selectedPlaces, // Place[]
      ...placesManagement.candidatePlaces // Place[]
    ];
    
    // Place[] 타입을 SelectedPlace[]로 변환 (타입 캐스팅)
    const convertedPlaces = convertToSelectedPlaces(allPlacesForRunner);
    
    return runScheduleGenerationFromRunner(
      payload,
      convertedPlaces, // 변환된 SelectedPlace[] 타입 사용
      tripDetails.dates?.startDate || null
    );
  }, [runScheduleGenerationFromRunner, placesManagement.selectedPlaces, placesManagement.candidatePlaces, tripDetails.dates]);

  const {
    createItinerary,
    isCreatingItinerary: isCreatingFromCustomHook,
  } = useCreateItineraryHandler({
    placesManagement: { // placesManagement 객체를 전달, 타입은 useCreateItineraryHandler의 Deps와 일치해야 함
        selectedPlaces: placesManagement.selectedPlaces,
        candidatePlaces: placesManagement.candidatePlaces,
        prepareSchedulePayload: placesManagement.prepareSchedulePayload, // 이 시그니처는 이미 (start, end) => Payload | null
        // handleAutoCompletePlaces는 optional이므로 없어도 됨. 필요시 추가
    },
    tripDetails: { // tripDetails 객체 전달
      dates: tripDetails.dates,
      startTime: tripDetails.startTime, // startTime, endTime 추가
      endTime: tripDetails.endTime,
    },
    runScheduleGeneration: adaptedRunScheduleGeneration, // 어댑터 함수 전달
  });

  // Create adapter for placesManagement to match expected types in useLeftPanelProps
  // This adaptedPlacesManagement is for useLeftPanelProps, not for useCreateItineraryHandler
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
    currentPanel: typedCurrentPanel,
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement: itineraryManagement,
    tripDetails,
    placesManagement: adaptedPlacesManagementForProps, // Props용으로 어댑팅된 placesManagement 사용
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
    placesManagement, // 원본 placesManagement 반환
    callbacks,
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
    devDebugInfoProps,
    categoryResultHandlers,
  };
};
