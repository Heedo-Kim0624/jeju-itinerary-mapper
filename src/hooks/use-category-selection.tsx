
import { useState } from 'react';

const categoryMap = {
  '숙소': 'accomodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe',
};

export const useCategorySelection = () => {
  // 카테고리 순서 선택 및 카테고리 선택 완료 여부
  const [categoryOrder, setCategoryOrder] = useState<string[]>(['숙소', '관광지', '음식점', '카페']);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState<boolean>(false);

  // 중앙 패널에 표시할 카테고리
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);

  // 키워드 선택 내용
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<{
    '숙소': string[],
    '관광지': string[],
    '음식점': string[],
    '카페': string[],
  }>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
  });

  // 키워드 선택 확인 여부
  const [confirmedCategories, setConfirmedCategories] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const handleCategoryClick = (categoryName: string) => {
    const orderCopy = [...categoryOrder];
    const idx = orderCopy.indexOf(categoryName);
    if (idx > 0) {
      // 항목을 제자리에서 제거
      orderCopy.splice(idx, 1);
      // 해당 항목을 배열의 시작점에 삽입
      orderCopy.unshift(categoryName);
    }
    setCategoryOrder(orderCopy);
  };

  const handleCategoryButtonClick = (categoryName: string) => {
    setActiveMiddlePanelCategory(categoryName);
  };

  const handlePanelBack = (categoryName: string) => {
    setActiveMiddlePanelCategory(null);
  };

  const handleConfirmCategory = (
    categoryName: string, 
    finalKeywords: string[],
    clearSelection: boolean = false
  ) => {
    if (clearSelection) {
      // Issue #5 fix - Clear the selection for this category when requested
      setSelectedKeywordsByCategory(prev => ({
        ...prev,
        [categoryName]: []
      }));
    }
    
    if (!confirmedCategories.includes(categoryName)) {
      setConfirmedCategories([...confirmedCategories, categoryName]);
      
      // 다음 카테고리로 자동 진행
      const currentIndex = categoryOrder.indexOf(categoryName);
      if (currentIndex + 1 < categoryOrder.length) {
        setStepIndex(currentIndex + 1);
      }
    }
    
    setActiveMiddlePanelCategory(null);
  };

  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory(prev => {
      const keywordsForCategory = prev[category as keyof typeof prev] || [];
      
      if (keywordsForCategory.includes(keyword)) {
        return {
          ...prev,
          [category]: keywordsForCategory.filter(kw => kw !== keyword)
        };
      } else {
        return {
          ...prev,
          [category]: [...keywordsForCategory, keyword]
        };
      }
    });
  };

  // 카테고리 버튼 활성화 여부 체크
  const isCategoryButtonEnabled = (category: string) => {
    // 이미 확인된 카테고리이거나 stepIndex와 일치하는 경우에만 활성화
    return confirmedCategories.includes(category) || categoryOrder[stepIndex] === category;
  };

  return {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    handleCategoryClick,
    handleCategoryButtonClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
    isCategoryButtonEnabled
  };
};
