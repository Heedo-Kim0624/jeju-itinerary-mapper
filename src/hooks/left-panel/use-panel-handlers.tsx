
import { useState } from 'react';

export const usePanelHandlers = () => {
  // 카테고리 결과 패널 상태
  const [showCategoryResult, setShowCategoryResult] = useState<"숙소" | "관광지" | "음식점" | "카페">("숙소");
  
  // 일정 보기 패널 상태
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  
  // 일정 모드 설정 상태 추가
  const [isItineraryMode, setItineraryMode] = useState<boolean>(false);
  
  // 패널 결과 닫기 핸들러
  const handleResultClose = () => {
    console.log('카테고리 결과 패널 닫기');
    setShowCategoryResult("숙소");
  };

  // 카테고리 설정 컨펌 핸들러
  const handleConfirmByCategory = {
    accommodation: () => {
      console.log('숙소 카테고리 설정 완료');
      setShowCategoryResult("숙소");
    },
    attraction: () => {
      console.log('관광지 카테고리 설정 완료');
      setShowCategoryResult("관광지");
    },
    restaurant: () => {
      console.log('음식점 카테고리 설정 완료');
      setShowCategoryResult("음식점");
    },
    cafe: () => {
      console.log('카페 카테고리 설정 완료');
      setShowCategoryResult("카페");
    },
  };

  // 카테고리 패널 뒤로가기 핸들러
  const handlePanelBackByCategory = {
    accommodation: () => console.log('숙소 카테고리 뒤로가기'),
    attraction: () => console.log('관광지 카테고리 뒤로가기'),
    restaurant: () => console.log('음식점 카테고리 뒤로가기'),
    cafe: () => console.log('카페 카테고리 뒤로가기'),
  };

  // 초기화 함수
  const setup = (
    selectedRegions: any[],
    handleConfirmCategory: () => void,
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
    // 새로 추가된 일정 모드 설정 함수 내보내기
    setItineraryMode,
    isItineraryMode,
  };
};
