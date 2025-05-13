
import { useState } from 'react';
import { useCategorySelection } from './use-category-selection';
import { useRegionSelection } from './use-region-selection';
import { usePanelVisibility } from './use-panel-visibility';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useItineraryActions } from './left-panel/use-itinerary-actions';
import { Place } from '@/types/supabase';

interface DirectInputValues {
  숙소: string;
  관광지: string;
  음식점: string;
  카페: string;
}

export const useLeftPanel = () => {
  // 왼쪽 패널 탭 관련 상태
  const [activeTab, setActiveTab] = useState<'계획' | '일정'>('계획');
  
  // 지역 선택 로직
  const regionSelection = useRegionSelection();
  
  // 카테고리 선택 로직
  const categorySelection = useCategorySelection();
  
  // 패널 표시 여부 로직
  const uiVisibility = usePanelVisibility();
  
  // 선택된 장소 관리 로직
  const placesManagement = useSelectedPlaces();
  
  // 여행 날짜/시간 관리 로직
  const tripDetails = useTripDetails();
  
  // 일정 생성 및 관리 로직
  const itineraryManagement = useItineraryActions();

  // 직접 입력 키워드 값 상태
  const [directInputValues, setDirectInputValues] = useState<DirectInputValues>({
    숙소: tripDetails.accomodationDirectInput,
    관광지: tripDetails.landmarkDirectInput,
    음식점: tripDetails.restaurantDirectInput,
    카페: tripDetails.cafeDirectInput
  });

  // 직접 입력 값 변경 핸들러
  const onDirectInputChange = (category: string, value: string) => {
    setDirectInputValues(prev => ({
      ...prev,
      [category]: value
    }));

    // 해당 카테고리별 직접 입력 값 동기화
    switch(category) {
      case '숙소':
        tripDetails.setAccomodationDirectInput(value);
        break;
      case '관광지':
        tripDetails.setLandmarkDirectInput(value);
        break;
      case '음식점':
        tripDetails.setRestaurantDirectInput(value);
        break;
      case '카페':
        tripDetails.setCafeDirectInput(value);
        break;
    }
  };

  // 카테고리 키워드 확정 핸들러 (직접 입력 포함)
  const handleConfirmByCategory = (category: string) => {
    const directInput = directInputValues[category as keyof DirectInputValues];
    
    // 직접 입력 값이 있고 ',' 또는 공백으로 구분된 경우, 배열로 변환
    let additionalKeywords: string[] = [];
    if (directInput) {
      additionalKeywords = directInput
        .split(/[,\s]+/) // 쉼표나 공백으로 분리
        .map(k => k.trim())
        .filter(k => k !== '');
    }
    
    // 선택된 키워드와 직접 입력 키워드를 결합
    const finalKeywords = [
      ...categorySelection.selectedKeywordsByCategory[category] || [],
      ...additionalKeywords
    ];
    
    console.log(`${category} 카테고리 최종 키워드:`, finalKeywords);
    
    // 키워드가 하나도 없는 경우 확정 불가
    if (finalKeywords.length === 0) {
      alert('최소 하나 이상의 키워드를 선택하거나 입력해야 합니다.');
      return;
    }
    
    // 선택된 키워드 업데이트
    categorySelection.handleConfirmCategory(
      category as any,
      finalKeywords,
      true // 기존 선택 초기화
    );
    
    // 결과 패널 표시
    uiVisibility.setShowCategoryResult(true);
  };

  // 카테고리별 패널 뒤로가기 핸들러
  const handlePanelBackByCategory = (category?: string) => {
    // 카테고리가 제공된 경우 해당 카테고리의 패널로 돌아감
    if (category) {
      categorySelection.handleCategoryButtonClick(category as any);
    } else {
      // 카테고리가 없으면 일반 뒤로가기
      categorySelection.handlePanelBack();
    }
    
    // 결과 패널 닫기
    uiVisibility.setShowCategoryResult(false);
  };

  return {
    activeTab,
    setActiveTab,
    regionSelection,
    categorySelection,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    keywordsAndInputs: {
      directInputValues, 
      onDirectInputChange,
      handleConfirmByCategory,
      handlePanelBackByCategory
    }
  };
};
