
import { useCategoryOrder } from './use-category-order';
import { useCategoryPanel } from './use-category-panel';
import { useCategoryKeywords } from './use-category-keywords';
import type { CategoryName } from '@/utils/categoryUtils'; // Ensure CategoryName is exported

export const useCategorySelection = () => {
  const {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    setStepIndex,
    handleCategoryClick, // This is CategoryName from useCategoryOrder
  } = useCategoryOrder();

  const {
    activeMiddlePanelCategory,
    confirmedCategories,
    setConfirmedCategories,
    handleCategoryButtonClick, // This is CategoryName from useCategoryPanel
    handlePanelBack,
  } = useCategoryPanel();

  const {
    selectedKeywordsByCategory,
    setSelectedKeywordsByCategory,
    toggleKeyword, // This is CategoryName from useCategoryKeywords
  } = useCategoryKeywords();

  const handleConfirmCategory = (
    categoryName: CategoryName, 
    finalKeywords: string[], // This seems to be unused currently
    clearSelection: boolean = false
  ) => {
    // setSelectedKeywordsByCategory might need to use finalKeywords if that's the intent
    if (clearSelection) {
      setSelectedKeywordsByCategory(prev => ({
        ...prev,
        [categoryName]: []
      }));
    } else {
       // If finalKeywords are provided, they should probably be set for the category
       setSelectedKeywordsByCategory(prev => ({
        ...prev,
        [categoryName]: finalKeywords 
      }));
    }
    
    if (!confirmedCategories.includes(categoryName)) {
      setConfirmedCategories([...confirmedCategories, categoryName]);
      
      const currentIndex = categoryOrder.indexOf(categoryName);
      if (currentIndex !== -1 && currentIndex + 1 < categoryOrder.length) { // Check if found
        setStepIndex(currentIndex + 1);
      }
    }
    
    handlePanelBack();
  };

  const isCategoryButtonEnabled = (category: CategoryName) => {
    // Ensure categoryOrder[stepIndex] is a valid comparison
    return confirmedCategories.includes(category) || (categoryOrder[stepIndex] === category && stepIndex < categoryOrder.length);
  };

  return {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    handleCategoryClick,
    handleCategoryButtonClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
    isCategoryButtonEnabled
  };
};
