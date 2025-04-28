
import { useState } from 'react';
import { CategoryName } from '@/utils/categoryUtils';

export const useCategoryOrder = () => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  
  const handleCategoryClick = (categoryName: CategoryName) => {
    // No-op since we no longer need category ordering
  };

  return {
    stepIndex,
    setStepIndex,
    handleCategoryClick,
  };
};
