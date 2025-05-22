import { useCallback } from 'react';
import type { CategoryName } from '@/types/core';

/**
 * 카테고리 선택 및 패널 제어 로직을 관리하는 훅
 */
export const useCategoryHandlers = (
  setShowCategoryResult: (category: CategoryName | null) => void,
  setActiveMiddlePanelCategory: (category: CategoryName | null) => void
) => {
  const handleCategorySelect = useCallback(
    (category: CategoryName) => {
      console.log(`[useCategoryHandlers] Category selected: ${category}`);
      setActiveMiddlePanelCategory(category);
    },
    [setActiveMiddlePanelCategory]
  );

  const handleCloseCategoryPanel = useCallback(
    (category: CategoryName) => {
      console.log(`[useCategoryHandlers] Closing panel for category: ${category}`);
      setActiveMiddlePanelCategory(null);
      setShowCategoryResult(null); // Ensure results panel for this category is also closed
    },
    [setActiveMiddlePanelCategory, setShowCategoryResult]
  );

  return {
    handleCategorySelect,
    handleCloseCategoryPanel,
  };
};
