
import { useState } from 'react';

export const useCategorySelection = () => {
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  
  // 현재 열려있는 카테고리 패널
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);
  
  // 키워드 선택이 완료된 카테고리 추적
  const [confirmedCategories, setConfirmedCategories] = useState<string[]>([]);
  
  // 키워드 저장 상태
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({});
  const [keywordPriorityByCategory, setKeywordPriorityByCategory] = useState<Record<string, string[]>>({});

  const handleCategoryClick = (category: string) => {
    if (!categorySelectionConfirmed) {
      // 카테고리 우선순위 선택 단계
      const idx = categoryOrder.indexOf(category);
      if (idx !== -1) {
        const newOrder = [...categoryOrder];
        newOrder.splice(idx, 1);
        setCategoryOrder(newOrder);
      } else if (categoryOrder.length < 4) {
        setCategoryOrder([...categoryOrder, category]);
      }
    } else {
      // 키워드 선택 단계에서는 패널 토글만 수행
      setActiveMiddlePanelCategory(prev => prev === category ? null : category);
    }
  };

  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const curr = prev[category] || [];
      const updated = curr.includes(keyword)
        ? curr.filter((k) => k !== keyword)
        : [...curr, keyword];
      return { ...prev, [category]: updated };
    });
  };

  const handlePanelBack = (category: string) => {
    // 패널을 닫고 해당 카테고리의 선택된 키워드를 초기화
    setActiveMiddlePanelCategory(null);
    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [category]: []
    }));
  };

  const handleConfirmCategory = (category: string, finalKeywords: string[]) => {
    // 키워드를 저장하고 카테고리를 완료 상태로 표시
    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [category]: finalKeywords
    }));
    setConfirmedCategories(prev => [...prev, category]);
    setActiveMiddlePanelCategory(null);
  };

  const handleRecommendationConfirm = () => {
    // 현재 카테고리의 추천 패널이 닫힐 때 다음 카테고리 활성화
    const currentIdx = categoryOrder.findIndex(cat => cat === activeMiddlePanelCategory);
    if (currentIdx >= 0 && currentIdx < categoryOrder.length - 1) {
      setStepIndex(currentIdx + 1);
    }
    setActiveMiddlePanelCategory(null);
  };

  return {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    keywordPriorityByCategory,
    handleCategoryClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
    handleRecommendationConfirm
  };
};
