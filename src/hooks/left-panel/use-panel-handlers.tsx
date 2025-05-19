
import { useState } from 'react';
import { usePanelVisibility } from '../use-panel-visibility';
import { useMapContext } from '@/components/rightpanel/MapContext';
import type { CategoryName, CategoryNameKorean } from '@/types';
import { toCategoryNameKorean, toCategoryName } from '@/types'; // Import converters

export const usePanelHandlers = () => {
  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult, // This state from usePanelVisibility is likely CategoryNameKorean | null based on setter error
    setShowCategoryResult, // Setter expects CategoryNameKorean | null
  } = usePanelVisibility();

  const [isItineraryMode, setIsItineraryMode] = useState(false);
  const { panTo } = useMapContext();

  const handleResultClose = () => {
    setShowCategoryResult(null); // This is fine as null is assignable
  };

  // Generate category-specific confirmation handlers
  const handleConfirmByCategory = {
    accommodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      const englishCategory: CategoryName = 'accommodation';
      handleConfirmCategory(englishCategory, finalKeywords, clearSelection);
      setShowCategoryResult(toCategoryNameKorean(englishCategory)); // Pass Korean
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      const englishCategory: CategoryName = 'landmark';
      handleConfirmCategory(englishCategory, finalKeywords, clearSelection);
      setShowCategoryResult(toCategoryNameKorean(englishCategory)); // Pass Korean
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      const englishCategory: CategoryName = 'restaurant';
      handleConfirmCategory(englishCategory, finalKeywords, clearSelection);
      setShowCategoryResult(toCategoryNameKorean(englishCategory)); // Pass Korean
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      const englishCategory: CategoryName = 'cafe';
      handleConfirmCategory(englishCategory, finalKeywords, clearSelection);
      setShowCategoryResult(toCategoryNameKorean(englishCategory)); // Pass Korean
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    }
  };

  // Panel back handlers by category
  // handlePanelBack itself expects English CategoryName
  const handlePanelBackByCategory = {
    accommodation: () => handlePanelBack('accommodation'),
    landmark: () => handlePanelBack('landmark'),
    restaurant: () => handlePanelBack('restaurant'),
    cafe: () => handlePanelBack('cafe')
  };

  const setItineraryMode = (value: boolean) => {
    setIsItineraryMode(value);
    if (value && !showItinerary) {
      setShowItinerary(true);
    }
  };

  let selectedRegions: any[] = [];
  // These functions expect English CategoryName
  let handleConfirmCategory = (category: CategoryName, keywords: string[], clear?: boolean) => {};
  let handlePanelBack = (category: CategoryName) => {}; 

  const setup = (
    regions: any[],
    confirmCategoryFn: (category: CategoryName, keywords: string[], clear?: boolean) => void,
    panelBackFn: (category: CategoryName) => void
  ) => {
    selectedRegions = regions;
    handleConfirmCategory = confirmCategoryFn;
    handlePanelBack = panelBackFn;
  };

  return {
    uiVisibility: {
      showItinerary,
      setShowItinerary,
      showCategoryResult, // This state variable itself (if used) would be CategoryNameKorean | null
      setShowCategoryResult, // Setter expects CategoryNameKorean | null
      handleResultClose,
    },
    handleConfirmByCategory,
    handlePanelBackByCategory,
    setItineraryMode,
    isItineraryMode,
    setup
  };
};
