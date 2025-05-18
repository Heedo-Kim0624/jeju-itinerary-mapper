
import { useState, useEffect, useCallback } from 'react';
import { useSelectedPlaces } from '../use-selected-places';
import { useTripDetails } from '../use-trip-details';
import { useCategoryResults } from '../use-category-results';
import { useItinerary, ItineraryDay } from '../use-itinerary';
import { useRegionSelection } from '../use-region-selection';
import { useCategorySelection } from '../use-category-selection';
import { useCategoryHandlers } from './use-category-handlers';
import { useItineraryHandlers } from './use-itinerary-handlers';
import { useInputState } from './use-input-state';
import { usePanelState } from './use-panel-state';
import { useCategoryEventHandlers } from './use-category-event-handlers';
import { Place, SelectedPlace } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';

/**
 * 좌측 패널 기능 통합 훅
 */
export const useLeftPanelIntegration = () => {
  // 패널 상태 관리
  const {
    selectedCategory,
    setSelectedCategory,
    showCategoryResultScreen,
    setShowCategoryResultScreen,
    currentPanel,
    setCurrentPanel
  } = usePanelState();

  // 지역 및 카테고리 선택 기능
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();
  
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

  // UI 가시성 관리
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);

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

  // 일정 관리 기능
  const { 
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setItinerary,
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary
  };

  // UI 가시성 관리 객체
  const uiVisibility = {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult
  };
  
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

  // 카테고리 이벤트 핸들러
  const categoryEventHandlers = useCategoryEventHandlers(
    refetch,
    setShowCategoryResult,
    (category) => categorySelection.handleConfirmCategory(category as CategoryName, []),
    selectedCategory
  );

  // 일정 핸들러
  const itineraryHandlers = useItineraryHandlers();
  
  // 일정 생성 핸들러
  const handleCreateItinerary = async () => {
    console.log("[use-left-panel-integration] 일정 생성 요청 시작");
    
    try {
      const success = await itineraryHandlers.handleCreateItinerary(
        tripDetails,
        placesManagement.selectedPlaces as SelectedPlace[],
        placesManagement.prepareSchedulePayload,
        itineraryManagement.generateItinerary,
        uiVisibility.setShowItinerary,
        (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
      );
      
      console.log(`[use-left-panel-integration] 일정 생성 ${success ? '성공' : '실패'}`);
      
      if (success) {
        console.log("[use-left-panel-integration] 일정 패널로 전환 시작");
        
        // 상태 업데이트 순서 보장을 위한 타임아웃 사용
        setTimeout(() => {
          uiVisibility.setShowItinerary(true);
          setCurrentPanel('itinerary');
          console.log("[use-left-panel-integration] 일정 패널로 전환 완료 (showItinerary=true, currentPanel=itinerary)");
        }, 200);
      }
      
      return success;
    } catch (error) {
      console.error("[use-left-panel-integration] 일정 생성 중 오류 발생:", error);
      toast.error("일정 생성 처리 중 내부 오류가 발생했습니다.");
      return false;
    }
  };
  
  // 일정 패널 닫기 핸들러
  const handleCloseItinerary = () => {
    itineraryHandlers.handleCloseItinerary(
      uiVisibility.setShowItinerary, 
      (panel: 'region' | 'date' | 'category' | 'itinerary') => setCurrentPanel(panel)
    );
    // Reset to a default panel when closing itinerary, e.g., category selection
    setCurrentPanel('category'); 
  };

  // 'itineraryCreated' 커스텀 이벤트 리스너
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null }>;
      
      console.log("[useLeftPanelIntegration] 'itineraryCreated' event received:", customEvent.detail);
      
      if (customEvent.detail.itinerary) {
        setItinerary(customEvent.detail.itinerary); 
      }
      
      if (customEvent.detail.selectedDay !== null) {
        setSelectedItineraryDay(customEvent.detail.selectedDay);
      } else if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
      } else {
        setSelectedItineraryDay(null);
      }
      
      setShowItinerary(true); 
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary]);

  // 일정 상태 변경 시 UI 갱신
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !showItinerary) {
      console.log("useLeftPanelIntegration: 일정이 생성되었으나 패널이 표시되지 않아 자동으로 활성화합니다.");
      setShowItinerary(true);
    }
    if (itinerary && itinerary.length > 0 && selectedItineraryDay === null) {
      console.log("useLeftPanelIntegration: 일정이 생성되었으나 날짜가 선택되지 않아 첫 번째 날짜를 선택합니다.");
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        setSelectedItineraryDay(itinerary[0].day);
      }
    }
  }, [itinerary, showItinerary, selectedItineraryDay, setShowItinerary, setSelectedItineraryDay]);

  return {
    // 통합된 모든 기능 및 핸들러 반환
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary,
    handleCloseItinerary,
    selectedCategory,
    showCategoryResultScreen,
    currentPanel,
    setCurrentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect: categoryEventHandlers.handleCategorySelect,
    handleCloseCategoryResult: categoryEventHandlers.handleCloseCategoryResult,
    handleConfirmCategory: categoryEventHandlers.handleConfirmCategoryFromButton
  };
};
