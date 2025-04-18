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

  const handlePanelBack = (category: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const newObj = { ...prev };
      delete newObj[category];
      return newObj;
    });
    setCurrentCategoryIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : 0;
      setActiveMiddlePanelCategory(categoryOrder[newIndex] || null);
      return newIndex;
    });
  };

  const handleConfirmCategory = (category: string, finalKeywords: string[]) => {
    setSelectedKeywordsByCategory({ ...selectedKeywordsByCategory, [category]: finalKeywords });
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
