
import { useState } from 'react';
import { CategoryName } from '@/utils/categoryUtils';

export const usePanelState = () => {
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);

  return {
    currentPanel,
    setCurrentPanel,
    showCategoryResult,
    setShowCategoryResult,
  };
};
