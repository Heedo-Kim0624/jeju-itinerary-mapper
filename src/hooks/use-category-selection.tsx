
import { useCategoryOrder } from './use-category-order';
import { useCategoryPanel } from './use-category-panel';
import { useCategoryKeywords } from './use-category-keywords';
import type { CategoryName, CategoryNameKorean } from '@/types'; // Import from @/types

export const useCategorySelection = () => {
  const {
    categoryOrder, // English CategoryName[]
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex, // Index for English categoryOrder
    setStepIndex,
    handleCategoryClick, // Expects Korean name from UI
  } = useCategoryOrder();

  const {
    activeMiddlePanelCategory, // English CategoryName | null
    confirmedCategories, // English CategoryName[]
    setConfirmedCategories, // Setter for English CategoryName[]
    handleCategoryButtonClick, // Expects English CategoryName
    handlePanelBack, // Expects English CategoryName
  } = useCategoryPanel();

  const {
    selectedKeywordsByCategory, // Keys are English CategoryName
    setSelectedKeywordsByCategory, // Expects English CategoryName as key
    toggleKeyword, // Expects English CategoryName as first arg
  } = useCategoryKeywords();

  // handleConfirmCategory expects English CategoryName
  const handleConfirmCategory = (
    categoryName: CategoryName, 
    finalKeywords: string[],
    clearSelection: boolean = false
  ) => {
    if (clearSelection) {
      setSelectedKeywordsByCategory(prev => ({
        ...prev,
        [categoryName]: [] // Use English CategoryName as key
      }));
    }
    
    if (!confirmedCategories.includes(categoryName)) {
      setConfirmedCategories([...confirmedCategories, categoryName]); // Add English CategoryName
      
      const currentIndex = categoryOrder.indexOf(categoryName); // Search in English categoryOrder
      if (currentIndex !== -1 && currentIndex + 1 < categoryOrder.length) {
        setStepIndex(currentIndex + 1);
      } else if (currentIndex === -1) {
        console.warn(`Category ${categoryName} not found in order for step update.`);
      }
    }
    
    handlePanelBack(categoryName); // Pass English CategoryName
  };

  // isCategoryButtonEnabled expects English CategoryName
  const isCategoryButtonEnabled = (category: CategoryName) => {
    return confirmedCategories.includes(category) || categoryOrder[stepIndex] === category;
  };

  return {
    categoryOrder, // English
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex, // English based
    activeMiddlePanelCategory, // English
    confirmedCategories, // English
    selectedKeywordsByCategory, // English keys
    handleCategoryClick, // Expects Korean, converts internally or relies on consumer to convert for other functions
    handleCategoryButtonClick, // Expects English
    toggleKeyword, // Expects English
    handlePanelBack, // Expects English
    handleConfirmCategory, // Expects English
    isCategoryButtonEnabled // Expects English
  };
};
