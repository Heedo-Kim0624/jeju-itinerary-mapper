import { useState } from 'react';
import { usePanelVisibility } from '../use-panel-visibility';
import { useMapContext } from '@/components/rightpanel/MapContext';
import type { CategoryName, CategoryNameKorean } from '@/types';

export const usePanelHandlers = () => {
  // Panel visibility functionality
  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult, // This is CategoryName | null
    setShowCategoryResult, // This is (value: CategoryName | null) => void
  } = usePanelVisibility();

  const [isItineraryMode, setIsItineraryMode] = useState(false);
  const { panTo } = useMapContext();

  // Result close handler
  const handleResultClose = () => {
    setShowCategoryResult(null);
  };

  // Generate category-specific confirmation handlers
  const handleConfirmByCategory = {
    accommodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('accommodation', finalKeywords, clearSelection);
      setShowCategoryResult('accommodation');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('landmark', finalKeywords, clearSelection);
      setShowCategoryResult('landmark');
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

  // Panel back handlers by category
  const handlePanelBackByCategory = {
    accommodation: () => handlePanelBack('accommodation'),
    landmark: () => handlePanelBack('landmark'),
    restaurant: () => handlePanelBack('restaurant'),
    cafe: () => handlePanelBack('cafe')
  };

  // 일정 모드 설정 함수
  const setItineraryMode = (value: boolean) => {
    setIsItineraryMode(value);
    
    // 일정 모드가 활성화되면 일정 화면을 자동으로 표시
    if (value && !showItinerary) {
      setShowItinerary(true);
    }
  };

  // These functions will be provided by props from use-left-panel
  let selectedRegions: any[] = [];
  // Updated type for confirmCategoryFn and panelBackFn
  let handleConfirmCategory = (category: CategoryName, keywords: string[], clear?: boolean) => {};
  let handlePanelBack = (category: CategoryName) => {}; // Changed to accept CategoryName

  // Setup function to inject dependencies from parent hook
  const setup = (
    regions: any[],
    confirmCategoryFn: (category: CategoryName, keywords: string[], clear?: boolean) => void,
    panelBackFn: (category: CategoryName) => void // Changed to accept CategoryName
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
