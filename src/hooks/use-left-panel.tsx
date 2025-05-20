
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
import { SchedulePayload } from '@/types/core';
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
    if (!tripDetailsHookResult.dates.startDate || !tripDetailsHookResult.dates.endDate) {
      console.error("[Adapter] Trip start or end date is missing in tripDetails.dates.");
      toast.error("여행 시작일 또는 종료일이 설정되지 않았습니다.");
      return null;
    }
    // payload.start_datetime과 payload.end_datetime은 SchedulePayload 타입에 의해 string으로 보장됨

    try {
      // itineraryManagement.generateItinerary가 5개의 인자를 받도록 호출 수정
      return await itineraryManagement.generateItinerary(
        placesManagement.selectedPlaces,    // 1. 사용자 선택 장소 (Place[])
        placesManagement.candidatePlaces,   // 2. 자동 완성 후보 장소 (Place[])
        payload.start_datetime,             // 3. 시작 날짜시간 문자열 (string)
        payload.end_datetime,               // 4. 종료 날짜시간 문자열 (string)
        tripDetailsHookResult.dates         // 5. 여행 날짜/시간 상세 객체 (TripDetails 인터페이스 타입)
      );
    } catch (error) {
      console.error("일정 생성 어댑터에서 오류:", error);
      // useItineraryCreation 쪽에서 이미 오류 토스트를 처리하므로 여기서는 중복 방지
      return null;
    }
  }, [itineraryManagement, placesManagement, tripDetailsHookResult]); // 의존성 배열 수정

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
