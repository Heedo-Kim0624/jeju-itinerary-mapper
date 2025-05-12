
import { useCategoryPanel } from '../use-category-panel';
import { CategoryName } from '@/utils/categoryUtils';

export const useKeywordConfirmation = (handleShowCategoryResult: (category: CategoryName | null) => void) => {
  const { handlePanelBack } = useCategoryPanel();

  // Category-specific confirmation handlers
  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('숙소', finalKeywords, clearSelection);
      handleShowCategoryResult('숙소');
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('관광지', finalKeywords, clearSelection);
      handleShowCategoryResult('관광지');
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('음식점', finalKeywords, clearSelection);
      handleShowCategoryResult('음식점');
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('카페', finalKeywords, clearSelection);
      handleShowCategoryResult('카페');
    }
  };

  // Generic handler for confirming a category
  const handleConfirmCategory = (categoryName: CategoryName, finalKeywords: string[], clearSelection: boolean) => {
    // Here you would add logic to save the selected keywords for the category
    // For now, just going back to the main panel
    handlePanelBack();
  };

  // Panel back handlers by category
  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack(),
    landmark: () => handlePanelBack(),
    restaurant: () => handlePanelBack(),
    cafe: () => handlePanelBack()
  };

  return {
    handleConfirmByCategory,
    handlePanelBackByCategory
  };
};
