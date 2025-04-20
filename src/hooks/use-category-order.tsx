
import { useState } from 'react';
import { CategoryName } from '@/utils/categoryUtils';

export const useCategoryOrder = () => {
  const [categoryOrder, setCategoryOrder] = useState<CategoryName[]>([]);
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const handleCategoryClick = (categoryName: CategoryName) => {
    setCategoryOrder(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(cat => cat !== categoryName);
      }
      if (prev.length < 4) {
        return [...prev, categoryName];
      }
      return prev;
    });
  };

  return {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    setStepIndex,
    handleCategoryClick,
  };
};
