
import { useEffect, useMemo } from 'react';
import { useCategorySelection } from './use-category-selection';
import { useRegionSelection } from './use-region-selection';
import { useTripDetails } from './use-trip-details';
import { useSelectedPlaces } from './use-selected-places';
import { useInputHandlers } from './left-panel/use-input-handlers';
import { usePanelHandlers } from './left-panel/use-panel-handlers';
import { useItineraryActions } from './left-panel/use-itinerary-actions';
import { toast } from 'sonner';
import type { CategoryName } from '@/utils/categoryUtils';

/**
 * 메인 왼쪽 패널 로직을 관리하는 훅
 * 여러 개별 훅들을 통합하여 일관된 인터페이스 제공
 */
export const useLeftPanel = () => {
  // 장소 선택 기능
  const {
    selectedPlaces,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected
  } = useSelectedPlaces();
  
  // 카테고리 선택 기능
  const {
    stepIndex: categoryStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    handleCategoryButtonClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
  } = useCategorySelection();

  // 지역 선택 기능
  const {
    selectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle
  } = useRegionSelection();

  // 여행 상세 정보 기능
  const {
    dates,
    setDates,
  } = useTripDetails();

  // 직접 입력 필드 핸들러
  const { directInputValues, onDirectInputChange } = useInputHandlers();

  // UI 가시성 및 패널 핸들러
  const panelHandlers = usePanelHandlers();
  
  // 패널 핸들러 초기화 - 함수 시그니처 수정
  useEffect(() => {
    // 핸들러 함수 시그니처를 맞추기 위해 래퍼 함수 생성
    const wrappedConfirmHandler = () => {
      console.log("Wrapper for handleConfirmCategory called");
    };
    
    panelHandlers.setup(selectedRegions, wrappedConfirmHandler, handlePanelBack);
  }, [selectedRegions, handleConfirmCategory, handlePanelBack]);
  
  // 일정 기능
  const {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setShowItinerary,
    handleSelectItineraryDay,
    handleCreateItinerary
  } = useItineraryActions();

  // 디버깅 정보 - 중요 상태 변경 시 로그 출력
  useEffect(() => {
    console.log("경로 생성 버튼 상태:", {
      allCategoriesSelected,
      selectedPlaces: selectedPlaces.length
    });
  }, [allCategoriesSelected, selectedPlaces.length]);

  // 일정 생성 함수에 대한 래퍼
  const createItinerary = () => {
    console.log("경로 생성 함수 호출됨", {
      selectedPlaces: selectedPlaces.length,
      dates: dates
    });
    
    if (!dates) {
      toast.error("여행 날짜를 먼저 설정해주세요!");
      return false;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 먼저 선택해주세요!");
      return false;
    }
    
    const result = handleCreateItinerary(selectedPlaces, dates);
    
    if (result) {
      // 일정 생성 성공 시 일정 보기로 전환
      setShowItinerary(true);
      
      // 일정 모드 설정 업데이트
      panelHandlers.setItineraryMode(true);
      
      console.log("일정 생성 성공! 일정 보기로 전환", {
        일수: result.length,
        showItinerary: true,
        itineraryMode: true
      });
      return true;
    }
    
    return false;
  };

  // 모든 훅과 핸들러를 기능별로 그룹화하여 반환
  const leftPanelState = useMemo(() => ({
    // 지역 선택
    regionSelection: {
      selectedRegions,
      regionConfirmed,
      setRegionConfirmed,
      regionSlidePanelOpen, 
      setRegionSlidePanelOpen,
      handleRegionToggle
    },
    
    // 카테고리 선택
    categorySelection: {
      categoryStepIndex,
      activeMiddlePanelCategory,
      confirmedCategories,
      handleCategoryButtonClick,
      selectedKeywordsByCategory,
      toggleKeyword,
      handlePanelBackByCategory: panelHandlers.handlePanelBackByCategory
    },
    
    // 키워드 및 입력
    keywordsAndInputs: {
      directInputValues,
      onDirectInputChange,
      handleConfirmByCategory: panelHandlers.handleConfirmByCategory,
    },
    
    // 장소 관리
    placesManagement: {
      selectedPlaces,
      handleSelectPlace,
      handleRemovePlace,
      handleViewOnMap,
      allCategoriesSelected,
    },
    
    // 여행 상세 정보
    tripDetails: {
      dates,
      setDates,
    },
    
    // UI 가시성
    uiVisibility: panelHandlers.uiVisibility,
    
    // 일정 관리
    itineraryManagement: {
      itinerary,
      selectedItineraryDay,
      showItinerary,
      setShowItinerary,
      handleSelectItineraryDay,
      handleCreateItinerary: createItinerary,
      isItineraryMode: panelHandlers.isItineraryMode,
      setItineraryMode: panelHandlers.setItineraryMode,
    },
  }), [
    selectedRegions, regionConfirmed, regionSlidePanelOpen, 
    categoryStepIndex, activeMiddlePanelCategory, confirmedCategories, selectedKeywordsByCategory,
    directInputValues, selectedPlaces, allCategoriesSelected, dates,
    panelHandlers.uiVisibility, itinerary, selectedItineraryDay, showItinerary,
    panelHandlers.isItineraryMode, panelHandlers.setItineraryMode
  ]);

  return leftPanelState;
};
