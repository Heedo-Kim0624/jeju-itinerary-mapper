
import { useState, useCallback } from 'react';
// Removed CategoryName import from '@/utils/categoryUtils'
import { CategoryName, CategoryNameKorean, toCategoryName, toCategoryNameKorean } from '@/types'; // Assuming CategoryName is English

export const useCategoryPanel = () => {
  // activeMiddlePanelCategory should store the English CategoryName
  const [activeMiddlePanelCategory, setActiveMiddlePanelCategory] = useState<CategoryName | null>(null);
  
  // confirmedCategories should store English CategoryName
  const [confirmedCategories, setConfirmedCategories] = useState<CategoryName[]>([]);

  // handleCategoryButtonClick expects English CategoryName (e.g., from LeftPanel.tsx converting Korean click)
  const handleCategoryButtonClick = useCallback((categoryName: CategoryName) => {
    setActiveMiddlePanelCategory(prev => prev === categoryName ? null : categoryName);
  }, []);

  const handlePanelBack = (categoryName: CategoryName) => { // Expects CategoryName
    setActiveMiddlePanelCategory(null);
    console.log(`[useCategoryPanel] Panel back for ${categoryName}, active panel now null`);
  };
  
  return {
    activeMiddlePanelCategory, // English CategoryName | null
    setActiveMiddlePanelCategory, // Setter for English CategoryName | null
    confirmedCategories, // English CategoryName[]
    setConfirmedCategories, // Setter for English CategoryName[]
    handleCategoryButtonClick, // Expects English CategoryName
    handlePanelBack, // Expects English CategoryName
  };
};
