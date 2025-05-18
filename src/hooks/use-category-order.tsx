
import { useState } from 'react';
import { CategoryName } from '@/utils/categoryUtils';

export const useCategoryOrder = () => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const categoryOrder: CategoryName[] = ["accommodation", "attraction", "restaurant", "cafe"];
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState<boolean>(true);
  
  const handleCategoryClick = (categoryName: CategoryName) => {
    // No-op since we no longer need category ordering, or find new index
    const newIndex = categoryOrder.indexOf(categoryName);
    if (newIndex !== -1) {
      setStepIndex(newIndex);
    }
  };
  
  const getRecommendedWeight = (category: CategoryName): number => {
    const weights: Partial<Record<CategoryName, number>> = { // Use Partial if not all CategoryName will have weights
      "accommodation": 1.0,
      "attraction": 1.0,
      "restaurant": 1.0, 
      "cafe": 1.0
    };
    
    return weights[category] || 1.0;
  };

  return {
    stepIndex,
    setStepIndex,
    handleCategoryClick,
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    getRecommendedWeight
  };
};
