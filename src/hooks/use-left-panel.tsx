
import { useState, useEffect, useCallback } from 'react';
import { TripDateTime, ItineraryDay } from '@/types/supabase';
import { useRegionSelection } from './use-region-selection';
import { completeWithRecommendedPlaces } from '@/lib/itinerary/itinerary-utils';
import { useCategorySelection } from './use-category-selection';
import { useSelectedPlaces } from './use-selected-places';
import { usePanelVisibility } from './use-panel-visibility';
import { useItinerary } from './use-itinerary';
import { toast } from 'sonner';
import { usePanelHandlers } from './left-panel/use-panel-handlers';
import { Place } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils'; 

export interface KeywordInputs {
  accomodation: string;
  landmark: string;
  restaurant: string;
  cafe: string;
}

export interface KeywordConfirm {
  accomodation: (finalKeywords: string[]) => void;
  landmark: (finalKeywords: string[]) => void;
  restaurant: (finalKeywords: string[]) => void;
  cafe: (finalKeywords: string[]) => void;
}

export interface PanelBack {
  accomodation: () => void;
  landmark: () => void;
  restaurant: () => void;
  cafe: () => void;
}

export const useLeftPanel = () => {
  // 직접 입력 관리
  const [directInputValues, setDirectInputValues] = useState<Record<string, string>>({});
  
  // 지역 선택 상태
  const regionSelection = useRegionSelection();
  
  // 카테고리 및 키워드 선택 상태
  const categorySelection = useCategorySelection();
  
  // 선택된 장소 목록 및 상태
  const placesManagement = useSelectedPlaces();
  
  // 여행 일정
  const [dates, setDates] = useState<TripDateTime | null>(null);
  
  // 패널 가시성 상태
  const uiVisibility = usePanelVisibility();
  
  // 일정 관리
  const itineraryManagement = useItinerary();

  // 패널 핸들러
  const panelHandlers = usePanelHandlers();
  
  // 초기화 시 패널 핸들러 setup
  useEffect(() => {
    panelHandlers.setup(
      regionSelection.selectedRegions,
      handleConfirmCategory,
      categorySelection.handlePanelBack
    );
  }, [regionSelection.selectedRegions]);
  
  // 직접 입력값 변경 핸들러
  const onDirectInputChange = (category: string, value: string) => {
    setDirectInputValues(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // 카테고리 확인 핸들러
  const handleConfirmCategory = useCallback((category: CategoryName, finalKeywords: string[], clearSelection: boolean = false) => {
    if (clearSelection) {
      categorySelection.setSelectedKeywordsByCategory(prev => ({
        ...prev,
        [category]: []
      }));
    }
    
    if (!categorySelection.confirmedCategories.includes(category)) {
      categorySelection.setConfirmedCategories([...categorySelection.confirmedCategories, category]);
      
      const currentIndex = categorySelection.categoryOrder.indexOf(category);
      if (currentIndex + 1 < categorySelection.categoryOrder.length) {
        categorySelection.setStepIndex(currentIndex + 1);
      }
    }
    
    // 추천 결과 화면 표시를 위해 카테고리를 설정
    uiVisibility.setShowCategoryResult(category);
    
    console.log(`카테고리 ${category} 확인됨, 키워드: ${finalKeywords.join(', ')}`);
  }, [categorySelection, uiVisibility]);
  
  // 일정 생성 핸들러
  const handleCreateItinerary = async () => {
    if (!dates) {
      toast.error("여행 날짜를 선택해주세요.");
      return false;
    }

    if (placesManagement.selectedPlaces.length === 0) {
      toast.error("최소한 한 개 이상의 장소를 선택해주세요.");
      return false;
    }

    try {
      // 여행 일수 계산
      const travelDays = Math.ceil(
        (dates.endDate.getTime() - dates.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      
      // 필요한 추가 장소 보완
      let finalPlaces = placesManagement.selectedPlaces;
      
      // 추천 장소로 부족한 장소 보완 - 각 카테고리별 추천 장소 매핑
      const recommendedPlacesByCategory: Record<string, Place[]> = {
        'attraction': [],
        'restaurant': [],
        'cafe': [],
        'accommodation': []
      };
      
      // 추천 장소가 있을 경우 보완
      if (Object.values(recommendedPlacesByCategory).some(places => places.length > 0)) {
        finalPlaces = await completeWithRecommendedPlaces(
          placesManagement.selectedPlaces,
          recommendedPlacesByCategory,
          travelDays
        );
      }

      // 일정 생성
      const itinerary = await itineraryManagement.generateItinerary(
        finalPlaces,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
      
      // 일정 생성 성공 시
      if (itinerary) {
        toast.success("일정이 성공적으로 생성되었습니다!");
        uiVisibility.setShowItinerary(true);
        return itinerary;
      } else {
        toast.error("일정 생성 중 오류가 발생했습니다.");
        return false;
      }
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return false;
    }
  };
  
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory,
  };
  
  const tripDetails = {
    dates,
    setDates,
  };
  
  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary,
    panelHandlers
  };
};
