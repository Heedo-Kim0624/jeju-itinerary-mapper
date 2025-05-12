
import { useCategoryPanel } from '../use-category-panel';
import { CategoryName } from '@/utils/categoryUtils';
import { useSelectedPlaces } from '../use-selected-places';
import { toast } from 'sonner';

export const useKeywordConfirmation = (handleShowCategoryResult: (category: CategoryName | null) => void) => {
  const { handlePanelBack } = useCategoryPanel();
  const { updateKeywords } = useSelectedPlaces();

  // Category-specific confirmation handlers
  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      console.log("숙소 키워드 확인:", finalKeywords);
      handleConfirmCategory('숙소', finalKeywords, clearSelection);
      handleShowCategoryResult('숙소');
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      console.log("관광지 키워드 확인:", finalKeywords);
      handleConfirmCategory('관광지', finalKeywords, clearSelection);
      handleShowCategoryResult('관광지');
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      console.log("음식점 키워드 확인:", finalKeywords);
      handleConfirmCategory('음식점', finalKeywords, clearSelection);
      handleShowCategoryResult('음식점');
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      console.log("카페 키워드 확인:", finalKeywords);
      handleConfirmCategory('카페', finalKeywords, clearSelection);
      handleShowCategoryResult('카페');
    }
  };

  // Generic handler for confirming a category
  const handleConfirmCategory = (categoryName: CategoryName, finalKeywords: string[], clearSelection: boolean) => {
    if (finalKeywords.length === 0) {
      toast.warning("키워드를 하나 이상 선택해주세요");
      return;
    }
    
    // 키워드 저장 및 업데이트
    updateKeywords(categoryName, finalKeywords);
    toast.success(`${categoryName} 키워드가 적용되었습니다`);
    
    // 패널 닫기
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
