
import { useState } from 'react';
import { CategoryName } from '@/utils/categoryUtils'; // Ensure CategoryName is exported

export const useCategoryOrder = () => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const categoryOrder: CategoryName[] = ["accommodation", "landmark", "restaurant", "cafe"]; // Use CategoryName values
  const [categorySelectionConfirmed, setCategorySelectionConfirmed] = useState<boolean>(true); // Default to true?
  
  const handleCategoryClick = (categoryName: CategoryName) => {
    // No-op logic seems to be intended
  };
  
  const getRecommendedWeight = (category: CategoryName): number => { // Use CategoryName
    const weights: Record<CategoryName, number> = {
      "accommodation": 1.0,
      "landmark": 1.0,
      "restaurant": 1.0, 
      "cafe": 1.0,
      "attraction": 1.0, // if attraction is a key
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

