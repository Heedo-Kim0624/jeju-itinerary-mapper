
import { useState } from 'react';

export const useCategorySelection = () => {
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<string | null>(null);
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({});
  const [keywordPriorityByCategory, setKeywordPriorityByCategory] = useState<Record<string, string[]>>({});

  const handleCategoryClick = (category: string) => {
    const index = categoryOrder.indexOf(category);
    if (index !== -1) {
      const newOrder = [...categoryOrder];
      newOrder.splice(index, 1);
      setCategoryOrder(newOrder);
    } else if (categoryOrder.length < 4) {
      setCategoryOrder([...categoryOrder, category]);
    }
  };

  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(keyword)
        ? current.filter((k) => k !== keyword)
        : [...current, keyword];
      return { ...prev, [category]: updated };
    });
  };

  // 닫기 버튼 클릭 시 선택한 키워드를 유지하면서 패널만 닫도록 수정
  const handlePanelBack = (category: string) => {
    // 키워드 선택 상태는 삭제하지 않고 패널만 닫음
    setActiveMiddlePanelCategory(null);
  };

  const handleConfirmCategory = (category: string, finalKeywords: string[]) => {
    setSelectedKeywordsByCategory((prev) => ({ ...prev, [category]: finalKeywords }));
    setActiveMiddlePanelCategory(null);
    setCurrentCategoryIndex((prev) => prev + 1);
  };

  return {
    categoryOrder,
    setCategoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    currentCategoryIndex,
    setCurrentCategoryIndex,
    activeMiddlePanelCategory,
    setActiveMiddlePanelCategory,
    selectedKeywordsByCategory,
    keywordPriorityByCategory,
    handleCategoryClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory
  };
};
