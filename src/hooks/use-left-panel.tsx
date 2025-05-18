
import { useState, useEffect, useCallback } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary, ItineraryDay } from './use-itinerary'; // ItineraryDay is now exported
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';
import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner';

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  // 지역 및 카테고리 선택 기능
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();
  
  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // 입력값 관리
  const { directInputValues, onDirectInputChange } = useInputState();

  // 키워드 및 입력 관련 기능
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category as CategoryName, finalKeywords, clearSelection);
      if (clearSelection) {
        setShowCategoryResult(category as CategoryName);
      }
    }
  };

  // 장소 관리 기능
  const {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    isAccommodationLimitReached,
    handleAutoCompletePlaces,
    isPlaceSelected
  } = useSelectedPlaces();

  const placesManagement = {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    isAccommodationLimitReached,
    prepareSchedulePayload,
    handleAutoCompletePlaces,
    isPlaceSelected
  };

  // 일정 관리 기능 (from useItinerary)
  const { 
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary, 
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary,
    handleServerItineraryResponse
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setItinerary, 
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary
  };

  // UI 가시성 관리
  const uiVisibility = {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult
  };

  // 일정 생성 러너 훅
  const { runScheduleGenerationProcess } = useScheduleGenerationRunner({
    selectedPlaces: selectedPlaces as SelectedPlace[],
    dates: tripDetails.dates,
    startDatetime: tripDetails.startDatetime,
    endDatetime: tripDetails.endDatetime,
    setItinerary,
    setSelectedDay: setSelectedItineraryDay,
    setIsLoadingState: setIsGenerating
  });

  // 카테고리 결과 관리
  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(showCategoryResult, 
    showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
    regionSelection.selectedRegions);

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // 카테고리 핸들러
  const categoryHandlers = useCategoryHandlers();
  const handleCategorySelect = (category: string) => categoryHandlers.handleCategorySelect(category, refetch);
  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value)
  );
  const handleConfirmCategoryFromButton = () => categoryHandlers.handleConfirmCategory(selectedCategory);

  // 일정 핸들러
  const itineraryHandlers = useItineraryHandlers();
  
  // 일정 생성 함수 - 로딩 상태와 서버 응답 처리 개선
  const handleCreateItinerary = useCallback(async () => {
    console.log('[useLeftPanel] handleCreateItinerary 호출됨');
    
    console.log('[useLeftPanel] 여행 날짜 정보:', {
      dates: tripDetails.dates,
      startDatetime: tripDetails.startDatetime,
      endDatetime: tripDetails.endDatetime
    });
    
    if (!tripDetails.dates || !tripDetails.dates.startDate || !tripDetails.dates.endDate) {
      console.error('[useLeftPanel] 여행 날짜가 선택되지 않았습니다.');
      toast.error('여행 날짜를 선택해주세요.');
      return false;
    }
    
    if (!allCategoriesSelected) {
      console.error('[useLeftPanel] 모든 카테고리에 장소가 선택되지 않았습니다.');
      toast.error('모든 카테고리에서 적어도 1개 이상의 장소를 선택해주세요.');
      return false;
    }
    
    try {
      // 일정 생성 실행 (비동기 처리)
      console.log('[useLeftPanel] 일정 생성 프로세스 실행');
      setIsGenerating(true);
      
      // 비동기로 일정 생성 실행
      await runScheduleGenerationProcess();
      
      console.log('[useLeftPanel] 일정 생성 성공. 강제 리렌더링 이벤트 발생');
      
      // 일정 데이터가 있고 패널이 표시되지 않았으면 패널 표시
      if (itinerary && itinerary.length > 0 && !showItinerary) {
        console.log('[useLeftPanel] 일정이 생성되어 패널 표시');
        setShowItinerary(true);
      }
      
      return true;
    } catch (error) {
      console.error("[useLeftPanel] 일정 생성 중 오류:", error);
      toast.error('일정 생성 중 오류가 발생했습니다.');
      setIsGenerating(false);
      return false;
    }
  }, [
    tripDetails, 
    allCategoriesSelected, 
    runScheduleGenerationProcess, 
    setShowItinerary, 
    itinerary, 
    showItinerary,
    setIsGenerating
  ]);
  
  const handleCloseItinerary = () => {
    itineraryHandlers.handleCloseItinerary(
      uiVisibility.setShowItinerary, 
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
  };

  // 이벤트 리스너 - 일정 생성 완료 이벤트
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null }>;
      
      console.log("[useLeftPanel] 'itineraryCreated' event received:", customEvent.detail);
      
      if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        console.log("[useLeftPanel] Setting itinerary from event:", customEvent.detail.itinerary.length);
        setItinerary(customEvent.detail.itinerary); 
        setShowItinerary(true);
        console.log("[useLeftPanel] Setting showItinerary to true after receiving itinerary");
      }
      
      if (customEvent.detail.selectedDay !== null) {
        setSelectedItineraryDay(customEvent.detail.selectedDay);
      } else if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
      } else {
        setSelectedItineraryDay(null);
      }
      
      // 로딩 상태 해제
      setIsGenerating(false);
      
      setTimeout(() => {
        console.log("[useLeftPanel] Forcing UI update after state changes from itineraryCreated event");
        window.dispatchEvent(new Event('forceRerender'));
      }, 200);
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsGenerating]);

  // 일정이 있지만 패널이 표시되지 않은 경우 자동으로 패널 표시
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !showItinerary) {
      console.log("useLeftPanel: 일정이 생성되었으나 패널이 표시되지 않아 자동으로 활성화합니다.");
      setShowItinerary(true);
    }
    
    if (itinerary && itinerary.length > 0 && selectedItineraryDay === null) {
      console.log("useLeftPanel: 일정이 생성되었으나 날짜가 선택되지 않아 첫 번째 날짜를 선택합니다.");
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        setSelectedItineraryDay(itinerary[0].day);
      }
    }
  }, [itinerary, showItinerary, selectedItineraryDay, setShowItinerary, setSelectedItineraryDay]);

  // 더미 상태를 이용한 강제 리렌더링 처리
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const forceRerenderListener = () => {
      console.log("[useLeftPanel] 'forceRerender' event caught, updating dummy state.");
      setForceUpdate(prev => prev + 1);
      setIsGenerating(false); // 강제 리렌더링 시 로딩 상태 해제
    };
    window.addEventListener('forceRerender', forceRerenderListener);
    return () => {
      window.removeEventListener('forceRerender', forceRerenderListener);
    };
  }, []);

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary,
    selectedCategory,
    currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton, 
    handleCloseItinerary,
    isGenerating,
    setIsGenerating
  };
};
