
import { useState, useCallback } from 'react';
import { useCategoryOrder } from './use-category-order';
import { useCategoryPanel } from './use-category-panel';
import { useCategoryKeywords } from './use-category-keywords';
import type { CategoryName } from '@/utils/categoryUtils';

export const useCategorySelection = () => {
  // Get category order state and functions
  const {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    setStepIndex,
    getRecommendedWeight
  } = useCategoryOrder();

  // Get category panel state and functions
  const {
    activeMiddlePanelCategory,
    confirmedCategories,
    setConfirmedCategories,
    handleCategoryButtonClick,
    handlePanelBack,
  } = useCategoryPanel();

  // Get keyword selection state and functions
  const {
    selectedKeywordsByCategory,
    setSelectedKeywordsByCategory,
    toggleKeyword,
  } = useCategoryKeywords();

  // Optimized handler to confirm category with selected keywords
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
    }
    
    // Only add the category if it's not already confirmed
    if (!confirmedCategories.includes(categoryName)) {
      setConfirmedCategories(prev => [...prev, categoryName]);
      
      // Move to the next step if the current step matches the confirmed category
      const currentIndex = categoryOrder.indexOf(categoryName);
      if (currentIndex + 1 < categoryOrder.length) {
        setStepIndex(currentIndex + 1);
      }
    }
    
    // Return to the main panel view
    handlePanelBack();
  }, [categoryOrder, confirmedCategories, setConfirmedCategories, setSelectedKeywordsByCategory, handlePanelBack, setStepIndex]);

  // Determine if a category button should be enabled
  const isCategoryButtonEnabled = useCallback((category: CategoryName) => {
    return confirmedCategories.includes(category) || categoryOrder[stepIndex] === category;
  }, [confirmedCategories, categoryOrder, stepIndex]);

  // Simple category click handler (now implemented separately in useCategoryOrder)
  const handleCategoryClick = useCallback((categoryName: CategoryName) => {
    // No-op since we handle this elsewhere
  }, []);

  return {
    // Category order related
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    
    // Category panel related
    activeMiddlePanelCategory,
    confirmedCategories,
    
    // Keywords related
    selectedKeywordsByCategory,
    
    // Handlers
    handleCategoryClick,
    handleCategoryButtonClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
    isCategoryButtonEnabled,
    getRecommendedWeight
  };
};
