
import { usePanelVisibility } from '../use-panel-visibility';
import { useMapContext } from '@/components/rightpanel/MapContext';

export const usePanelHandlers = () => {
  // Panel visibility functionality
  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult,
  } = usePanelVisibility();

  const { panTo } = useMapContext();

  // Result close handler
  const handleResultClose = () => {
    setShowCategoryResult(null);
  };

  // Generate category-specific confirmation handlers
  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('숙소', finalKeywords, clearSelection);
      setShowCategoryResult('숙소');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('관광지', finalKeywords, clearSelection);
      setShowCategoryResult('관광지');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('음식점', finalKeywords, clearSelection);
      setShowCategoryResult('음식점');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('카페', finalKeywords, clearSelection);
      setShowCategoryResult('카페');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    }
  };

  // Panel back handlers by category
  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack(),
    landmark: () => handlePanelBack(),
    restaurant: () => handlePanelBack(),
    cafe: () => handlePanelBack()
  };

  // These functions will be provided by props from use-left-panel
  let selectedRegions: any[] = [];
  let handleConfirmCategory = (category: string, keywords: string[], clear?: boolean) => {};
  let handlePanelBack = () => {};

  // Setup function to inject dependencies from parent hook
  const setup = (
    regions: any[],
    confirmCategoryFn: (category: string, keywords: string[], clear?: boolean) => void,
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
    setup
  };
};
