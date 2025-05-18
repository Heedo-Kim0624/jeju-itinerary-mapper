
import { useState } from 'react';
import { usePanelVisibility } from '../use-panel-visibility';
import { useMapContext } from '@/components/rightpanel/MapContext';
import type { CategoryName } from '@/utils/categoryUtils';

export const usePanelHandlers = () => {
  // Panel visibility functionality
  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult, // This will be CategoryName | null (English)
    setShowCategoryResult, // This expects CategoryName | null (English)
  } = usePanelVisibility();

  const [isItineraryMode, setIsItineraryMode] = useState(false);
  const { panTo } = useMapContext();

  // Result close handler
  const handleResultClose = () => {
    setShowCategoryResult(null);
  };

  // Generate category-specific confirmation handlers
  // These handlers are keyed by English CategoryName
  const handleConfirmByCategory: Record<CategoryName, (finalKeywords: string[], clearSelection?: boolean) => void> = {
    accommodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('accommodation', finalKeywords, clearSelection); // Pass English CategoryName
      setShowCategoryResult('accommodation'); // Pass English CategoryName
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    attraction: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('attraction', finalKeywords, clearSelection);
      setShowCategoryResult('attraction');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('restaurant', finalKeywords, clearSelection);
      setShowCategoryResult('restaurant');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('cafe', finalKeywords, clearSelection);
      setShowCategoryResult('cafe');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    }
  };

  // Panel back handlers by category, keyed by English CategoryName
  const handlePanelBackByCategory: Record<CategoryName, () => void> = {
    accommodation: () => handlePanelBack(),
    attraction: () => handlePanelBack(),
    restaurant: () => handlePanelBack(),
    cafe: () => handlePanelBack()
  };

  // 일정 모드 설정 함수
  const setItineraryMode = (value: boolean) => {
    setIsItineraryMode(value);
    
    if (value && !showItinerary) {
      setShowItinerary(true);
    }
  };

  // These functions will be provided by props from use-left-panel
  let selectedRegions: string[] = []; // Changed from any[]
  let handleConfirmCategory: (category: CategoryName, keywords: string[], clear?: boolean) => void = () => {};
  let handlePanelBack: () => void = () => {};

  // Setup function to inject dependencies from parent hook
  const setup = (
    regions: string[], // Changed from any[]
    confirmCategoryFn: (category: CategoryName, keywords: string[], clear?: boolean) => void,
    panelBackFn: () => void
  ) => {
    selectedRegions = regions;
    handleConfirmCategory = confirmCategoryFn;
    handlePanelBack = panelBackFn;
  };

  return {
    uiVisibility: {
      showItinerary,
      setShowItinerary,
      showCategoryResult,
      setShowCategoryResult,
      handleResultClose,
    },
    handleConfirmByCategory,
    handlePanelBackByCategory,
    setItineraryMode,
    isItineraryMode,
    setup
  };
};
