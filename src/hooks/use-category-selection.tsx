
import { useState } from 'react';

export const useCategorySelection = () => {
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);
  const [confirmedCategories, setConfirmedCategories] = useState<string[]>([]);
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
    }
  };

  const handleCategoryButtonClick = (category: string) => {
    if (categorySelectionConfirmed) {
      const categoryIndex = categoryOrder.indexOf(category);
      const lastConfirmedIndex = categoryOrder.findIndex(cat => !confirmedCategories.includes(cat)) - 1;
      
      // 현재 카테고리가 활성화된 상태이거나 이전 카테고리가 모두 완료된 경우에만 토글 가능
      if (categoryIndex === 0 || categoryIndex <= lastConfirmedIndex + 1) {
        setActiveMiddlePanelCategory(prev => prev === category ? null : category);
      }
    }
  };

  const handlePanelBack = (category: string) => {
    setActiveMiddlePanelCategory(null);
    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [category]: []
    }));
  };

  const handleConfirmCategory = (category: string, finalKeywords: string[]) => {
    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [category]: finalKeywords
    }));
    setConfirmedCategories(prev => [...prev, category]);
    setActiveMiddlePanelCategory(null);
    
    // 다음 카테고리의 stepIndex 설정
    const currentIndex = categoryOrder.indexOf(category);
    if (currentIndex < categoryOrder.length - 1) {
      setStepIndex(currentIndex + 1);
    }
  };

  const isCategoryButtonEnabled = (category: string) => {
    if (!categorySelectionConfirmed) return true;
    
    const categoryIndex = categoryOrder.indexOf(category);
    if (categoryIndex === 0) return true;
    
    const previousCategory = categoryOrder[categoryIndex - 1];
    return confirmedCategories.includes(previousCategory);
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
    handleCategoryButtonClick,
    toggleKeyword: (category: string, keyword: string) => {
      setSelectedKeywordsByCategory((prev) => {
        const curr = prev[category] || [];
        const updated = curr.includes(keyword)
          ? curr.filter((k) => k !== keyword)
          : [...curr, keyword];
        return { ...prev, [category]: updated };
      });
    },
    handlePanelBack,
    handleConfirmCategory,
    isCategoryButtonEnabled
  };
};
