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
import { SchedulePayload, Place } from '@/types/core'; // Place 임포트 추가
import { toast } from 'sonner'; // toast 임포트 추가

/**
 * 왼쪽 패널 기능 통합 훅
 * Main hook that composes all left panel functionality
 */
export const useLeftPanel = () => {
  // Core state management
  const leftPanelState = useLeftPanelState();
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetailsHookResult = useTripDetails(); // 변수명 변경하여 명확히 구분
  const { directInputValues, onDirectInputChange } = useInputState();
  
  // Set up event listeners
  useEventListeners(
    leftPanelState.setIsGenerating,
    leftPanelState.setItineraryReceived
  );

  // Place management
  const placesManagement = useSelectedPlaces();

  // Itinerary management
  const itineraryManagement = useItinerary();

  // UI visibility
  const uiVisibility = {
    showItinerary: itineraryManagement.showItinerary,
    setShowItinerary: itineraryManagement.setShowItinerary,
    showCategoryResult: leftPanelState.showCategoryResult,
    setShowCategoryResult: leftPanelState.setShowCategoryResult
  };

  // Category handlers
  const categoryHandlers = useCategoryHandlers();
  
  // Keyword and input management
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category as any, finalKeywords, clearSelection);
      if (clearSelection) {
        leftPanelState.setShowCategoryResult(category as any);
      }
    }
  };

  // Category result handlers
  const categoryResultHandlers = useCategoryResultHandlers(
    regionSelection.selectedRegions,
    tripDetailsHookResult, // 수정된 변수명 사용
    placesManagement.handleAutoCompletePlaces,
    leftPanelState.setShowCategoryResult
  );

  // 함수 시그니처 불일치 해결을 위한 어댑터 함수
  const generateItineraryAdapter = useCallback(async (payload: SchedulePayload) => {
    // payload는 UseItineraryCreationProps에 의해 전달되지만,
    // 클라이언트 사이드 생성기를 직접 호출할 때는 내부의 selected_places 등은 직접 사용하지 않고,
    // placesManagement와 tripDetailsHookResult에서 전체 Place 객체와 Date 객체를 가져와 사용합니다.

    if (!tripDetailsHookResult.dates.startDate || !tripDetailsHookResult.dates.endDate) {
      console.error("[Adapter] Trip start or end date is missing in tripDetails.dates.");
      toast.error("여행 시작일 또는 종료일이 설정되지 않았습니다.");
      return null;
    }
    // tripDetailsHookResult.startTime 와 tripDetailsHookResult.endTime 은 초기값을 가지므로 null 체크 불필요

    const placesForClientGenerator: Place[] = [
      ...(placesManagement.selectedPlaces as Place[]), // SelectedPlace[]를 Place[]로 캐스팅
      ...(placesManagement.candidatePlaces as Place[]), // Place[]는 그대로 사용
    ];

    if (placesForClientGenerator.length === 0) {
        toast.info("일정을 생성할 장소가 선택되지 않았습니다. (Adapter)");
        return null;
    }

    try {
      // itineraryManagement.generateItinerary 함수는 다음 인자들을 기대합니다:
      // 1. placesToUse: Place[]
      // 2. startDate: Date
      // 3. endDate: Date
      // 4. startTime: string (HH:MM format)
      // 5. endTime: string (HH:MM format)
      return await itineraryManagement.generateItinerary(
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
  }, [itineraryManagement, placesManagement, tripDetailsHookResult]); // 의존성 배열에 placesManagement 추가

  // Itinerary creation logic
  const itineraryCreation = useItineraryCreation({
    tripDetails: tripDetailsHookResult, // 수정된 변수명 사용
    userDirectlySelectedPlaces: placesManagement.selectedPlaces,
    autoCompleteCandidatePlaces: placesManagement.candidatePlaces,
    prepareSchedulePayload: placesManagement.prepareSchedulePayload,
    generateItinerary: generateItineraryAdapter,
    setShowItinerary: itineraryManagement.setShowItinerary,
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
    leftPanelState.showCategoryResult, 
    leftPanelState.showCategoryResult 
      ? categorySelection.selectedKeywordsByCategory[leftPanelState.showCategoryResult] || [] 
      : [], 
    regionSelection.selectedRegions
  );

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // Handle panel navigation and view changes based on itinerary state
  useEffect(() => {
    if (itineraryManagement.isItineraryCreated && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0) {
      if (!uiVisibility.showItinerary) {
         console.log("useLeftPanel: Itinerary created, ensuring panel is visible.");
         uiVisibility.setShowItinerary(true);
      }
      if (leftPanelState.currentPanel !== 'itinerary') {
        leftPanelState.setCurrentPanel('itinerary');
      }
    }
  }, [
    itineraryManagement.isItineraryCreated, 
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    leftPanelState.currentPanel,
    leftPanelState.setCurrentPanel,
    uiVisibility.setShowItinerary
  ]);

  // Combine and return all necessary functionality
  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails: tripDetailsHookResult, // 수정된 변수명 사용
    uiVisibility,
    itineraryManagement: {
      itinerary: itineraryManagement.itinerary,
      selectedItineraryDay: itineraryManagement.selectedItineraryDay,
      handleSelectItineraryDay: itineraryManagement.handleSelectItineraryDay,
    },
    handleCreateItinerary: itineraryCreation.handleInitiateItineraryCreation,
    handleCloseItinerary: itineraryCreation.handleCloseItineraryPanel,
    selectedCategory: leftPanelState.selectedCategory,
    currentPanel: leftPanelState.currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    categoryResultHandlers, 
    handleCategorySelect: (category: string) => 
      categoryHandlers.handleCategorySelect(category, refetch),
    isGeneratingItinerary: leftPanelState.isGenerating,
    itineraryReceived: leftPanelState.itineraryReceived,
  };
};
