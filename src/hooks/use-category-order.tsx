
import { useState, useMemo } from 'react';
// Removed CategoryName import from '@/utils/categoryUtils'
import { CategoryName, CategoryNameKorean, toCategoryName, toCategoryNameKorean } from '@/types';
import { CATEGORIES as DEFAULT_KOREAN_CATEGORIES } from '@/utils/categoryUtils'; // This is CategoryNameKorean[]

export const useCategoryOrder = () => {
  // Internal order uses English CategoryName for consistency with other state like activeMiddlePanelCategory
  const categoryOrder: CategoryName[] = useMemo(() => DEFAULT_KOREAN_CATEGORIES.map(kc => toCategoryName(kc)), [DEFAULT_KOREAN_CATEGORIES]);
  
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState(false); // This might be tied to region confirmation
  const [stepIndex, setStepIndex] = useState(0); // Index for categoryOrder (English names)

  const handleCategoryClick = (koreanCategoryName: CategoryNameKorean) => {
    const englishCategoryName = toCategoryName(koreanCategoryName);
    const index = categoryOrder.indexOf(englishCategoryName);
    if (index !== -1) {
      setStepIndex(index);
      // This might also trigger opening the specific category panel, handled by useCategoryPanel's handleCategoryButtonClick
    }
  };
  
  // Use this to get Korean names for display in UI (e.g., CategoryNavigation)
  const koreanCategoryOrderForDisplay: CategoryNameKorean[] = useMemo(() => categoryOrder.map(ec => toCategoryNameKorean(ec)), [categoryOrder]);


  return {
    categoryOrder, // English CategoryName[]
    koreanCategoryOrderForDisplay, // CategoryNameKorean[]
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex, // Refers to index in English categoryOrder
    setStepIndex,
    handleCategoryClick, // Expects Korean name from UI, internally manages English stepIndex
  };
};
