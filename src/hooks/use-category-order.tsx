
import { useState } from 'react';
import { CategoryName } from '@/utils/categoryUtils';

export const useCategoryOrder = () => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  // Add the missing properties
  const categoryOrder: CategoryName[] = ["숙소", "관광지", "음식점", "카페"];
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState<boolean>(true);
  
  const handleCategoryClick = (categoryName: CategoryName) => {
    // No-op since we no longer need category ordering
  };

  return {
    stepIndex,
    setStepIndex,
    handleCategoryClick,
    // Return the new properties
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed
  };
};
