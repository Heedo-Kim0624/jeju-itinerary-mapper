import { useCategoryOrder } from './use-category-order';
import { useCategoryPanel } from './use-category-panel';
import { useCategoryKeywords } from './use-category-keywords';
import type { CategoryName } from '@/utils/categoryUtils';
import { useCallback } from 'react';

export const useCategorySelection = () => {
  const {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    setStepIndex,
    handleCategoryClick: handleCategoryOrderClick,
  } = useCategoryOrder();

  const {
    activeMiddlePanelCategory,
    confirmedCategories,
    setConfirmedCategories,
    handleCategoryButtonClick,
    handlePanelBack: handleCategoryPanelBack,
  } = useCategoryPanel();

  const {
    selectedKeywordsByCategory,
    setSelectedKeywordsByCategory,
    toggleKeyword,
    clearKeywordsForCategory,
  } = useCategoryKeywords();

  const handleConfirmCategory = useCallback((
    categoryName: CategoryName, 
    finalKeywords: string[],
    clearSelection: boolean = false
  ) => {
    if (clearSelection) {
      setSelectedKeywordsByCategory(prev => ({
        ...prev,
        [categoryName]: []
      }));
    } else {
      setSelectedKeywordsByCategory(prev => ({
        ...prev,
        [categoryName]: finalKeywords
      }));
    }
    
    if (!confirmedCategories.includes(categoryName)) {
      setConfirmedCategories(prev => [...prev, categoryName]);
      
      const currentIndex = categoryOrder.indexOf(categoryName);
      if (currentIndex !== -1 && currentIndex + 1 < categoryOrder.length) {
        setStepIndex(currentIndex + 1);
        handleCategoryButtonClick(categoryOrder[currentIndex + 1]);
      }
    }
  }, [categoryOrder, confirmedCategories, setConfirmedCategories, setSelectedKeywordsByCategory, setStepIndex]);

  const handleCategoryClick = useCallback((categoryName: CategoryName) => {
    handleCategoryOrderClick(categoryName);
    handleCategoryButtonClick(categoryName);
  }, [handleCategoryOrderClick, handleCategoryButtonClick]);

  const isCategoryButtonEnabled = (category: CategoryName) => {
    return confirmedCategories.includes(category) || categoryOrder[stepIndex] === category;
  };

  const handlePanelBackByCategory = categoryOrder.reduce((acc, category) => {
    acc[category] = handleCategoryPanelBack;
    return acc;
  }, {} as Record<CategoryName, () => void>);

  return {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    setStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    setConfirmedCategories,
    selectedKeywordsByCategory,
    setSelectedKeywordsByCategory,
    toggleKeyword,
    clearKeywordsForCategory,
    handleConfirmCategory,
    isCategoryButtonEnabled,
    handleCategoryClick,
    handlePanelBack: handleCategoryPanelBack,
    handlePanelBackByCategory,
  };
};
