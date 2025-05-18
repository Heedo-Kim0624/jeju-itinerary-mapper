
import { useState } from 'react';

/**
 * 패널 상태 관리를 위한 훅
 */
export const usePanelState = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryResultScreen, setShowCategoryResultScreen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  
  return {
    selectedCategory,
    setSelectedCategory,
    showCategoryResultScreen,
    setShowCategoryResultScreen,
    currentPanel,
    setCurrentPanel
  };
};
