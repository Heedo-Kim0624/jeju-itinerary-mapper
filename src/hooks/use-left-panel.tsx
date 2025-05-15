
import React, { useState, useEffect } from 'react'; // React 추가
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state';
import { CategoryName } from '@/utils/categoryUtils'; // CategoryName 임포트
import { Place } from '@/types/supabase'; // Place 임포트
import { RegionDetails } from '@/types/region'; // RegionDetails 임포트

/**
 * 왼쪽 패널 기능 통합 훅
 */
export const useLeftPanel = () => {
  // 지역 및 카테고리 선택 기능
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();
  
  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | null>(null); // 타입 CategoryName으로 변경
  const [showCategoryResultScreen, setShowCategoryResultScreen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null); // 타입 CategoryName으로 변경
  
  // 입력값 관리
  const { directInputValues, onDirectInputChange } = useInputState();

  // 키워드 및 입력 관련 기능
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: CategoryName, finalKeywords: string[], clearSelection: boolean = false) => { // 타입 CategoryName으로 변경
      categorySelection.handleConfirmCategory(category, finalKeywords, clearSelection);
      if (clearSelection) {
        setShowCategoryResult(category);
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
    prepareSchedulePayload
  };

  // 일정 관리 기능
  const { 
    itinerary,
    selectedItineraryDay,
    showItinerary,
    // setItinerary, // setItinerary는 generateItinerary를 통해 관리될 수 있음
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setSelectedItineraryDay,
    handleSelectItineraryDay
  };

  // UI 가시성 관리
  const uiVisibility = {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult
  };
  
  const selectedRegionDetails: RegionDetails[] = regionSelection.selectedRegions;


  // 카테고리 결과 관리
  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(showCategoryResult, 
    showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
    selectedRegionDetails); // RegionDetails[] 타입으로 전달


  const categoryResults = {
    recommendedPlaces: (recommendedPlaces || []) as Place[], // 타입 단언
    normalPlaces: (normalPlaces || []) as Place[] // 타입 단언
  };

  // 카테고리 핸들러
  const categoryHandlers = useCategoryHandlers();
  const handleCategorySelect = (category: CategoryName) => categoryHandlers.handleCategorySelect(category, refetch); // 타입 CategoryName으로 변경
  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(setShowCategoryResult);
  const handleConfirmCategory = () => categoryHandlers.handleConfirmCategory(selectedCategory);

  // 일정 핸들러
  const itineraryHandlers = useItineraryHandlers();
  const handleCreateItinerary = async () => {
    return itineraryHandlers.handleCreateItinerary(
      tripDetails,
      selectedPlaces,
      prepareSchedulePayload,
      recommendedPlaces as Place[], // 타입 단언
      generateItinerary,
      setShowItinerary,
      setCurrentPanel // 타입을 올바르게 전달 (Dispatch<SetStateAction<...>>)
    );
  };
  
  const handleCloseItinerary = () => {
    itineraryHandlers.handleCloseItinerary(setShowItinerary, setCurrentPanel); // 타입을 올바르게 전달
  };

  // 일정이 생성되면 첫 번째 날짜 선택
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && showItinerary) {
      setSelectedItineraryDay(itinerary[0]?.day || 1);
    }
  }, [itinerary, showItinerary, setSelectedItineraryDay]);

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
    showCategoryResultScreen,
    currentPanel,
    setCurrentPanel, // setCurrentPanel을 반환하여 LeftPanel에서 직접 사용
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory,
    handleCloseItinerary,
    // onRegionsChange 와 같은 함수는 regionSelection 객체 내에 있어야 함
    // setKeywords, clearKeywords는 categorySelection 객체 내에 있어야 함
  };
};
