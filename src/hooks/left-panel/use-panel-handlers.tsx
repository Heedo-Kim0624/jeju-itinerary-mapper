
import { useState } from 'react';
import type { CategoryName } from '@/utils/categoryUtils';

export const usePanelHandlers = () => {
  // 카테고리 결과 패널 상태
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>("숙소");
  
  // 일정 보기 패널 상태
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  
  // 일정 모드 설정 상태 추가
  const [isItineraryMode, setItineraryMode] = useState<boolean>(false);
  
  // 패널 결과 닫기 핸들러
  const handleResultClose = () => {
    console.log('카테고리 결과 패널 닫기');
    setShowCategoryResult("숙소");
  };

  // 카테고리 설정 컨펌 핸들러 - 이름을 accomodation, landmark로 변경
  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[]) => {
      console.log('숙소 카테고리 설정 완료', finalKeywords);
      setShowCategoryResult("숙소");
    },
    landmark: (finalKeywords: string[]) => {
      console.log('관광지 카테고리 설정 완료', finalKeywords);
      setShowCategoryResult("관광지");
    },
    restaurant: (finalKeywords: string[]) => {
      console.log('음식점 카테고리 설정 완료', finalKeywords);
      setShowCategoryResult("음식점");
    },
    cafe: (finalKeywords: string[]) => {
      console.log('카페 카테고리 설정 완료', finalKeywords);
      setShowCategoryResult("카페");
    },
  };

  // 카테고리 패널 뒤로가기 핸들러 - 이름을 accomodation, landmark로 변경
  const handlePanelBackByCategory = {
    accomodation: () => console.log('숙소 카테고리 뒤로가기'),
    landmark: () => console.log('관광지 카테고리 뒤로가기'),
    restaurant: () => console.log('음식점 카테고리 뒤로가기'),
    cafe: () => console.log('카페 카테고리 뒤로가기'),
  };

  // 초기화 함수 - 함수 시그니처를 업데이트하여 적절한 파라미터를 받도록 함
  const setup = (
    selectedRegions: any[],
    handleConfirmCategory: (categoryName: string, finalKeywords: string[], clearSelection?: boolean) => void,
    handlePanelBack: () => void
  ) => {
    // 여기서 필요하다면 추가 초기화 작업을 수행할 수 있습니다.
    console.log('패널 핸들러 초기화됨', { 
      selectedRegions: selectedRegions?.length, 
      hasConfirmHandler: !!handleConfirmCategory,
      hasBackHandler: !!handlePanelBack
    });
  };

  return {
    uiVisibility: {
      showItinerary,
      setShowItinerary,
      showCategoryResult,
      setShowCategoryResult,
      handleResultClose,
    },
    handleConfirmByCategory,
    handlePanelBackByCategory,
    setup,
    // 일정 모드 설정 함수 내보내기
    setItineraryMode,
    isItineraryMode,
  };
};
