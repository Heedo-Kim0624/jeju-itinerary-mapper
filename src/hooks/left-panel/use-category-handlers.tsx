
import { useCallback } from 'react';
import { toast } from 'sonner';
import { CategoryName } from '@/utils/categoryUtils';
import { useMapContext } from '@/components/rightpanel/MapContext';

/**
 * 카테고리 관련 핸들러 훅
 */
export const useCategoryHandlers = () => {
  const { panTo } = useMapContext();
  
  // 카테고리 선택 핸들러
  const handleCategorySelect = useCallback((category: CategoryName, refetch: () => void) => {
    console.log(`카테고리 선택: ${category}`); // category is now English CategoryName
    refetch(); 
  }, []);

  // 결과 닫기 핸들러
  const handleCloseCategoryResult = useCallback((setShowCategoryResult: (value: CategoryName | null) => void) => {
    console.log("카테고리 결과 화면 닫기");
    setShowCategoryResult(null);
  }, []);
  
  // 카테고리 확인 핸들러
  const handleConfirmCategory = useCallback((selectedCategory: CategoryName | null) => {
    if (selectedCategory) {
      console.log(`${selectedCategory} 선택 완료`); // selectedCategory is English
    }
    return true; // Kept original return
  }, []);

  // 카테고리별 확인 핸들러 생성
  // This function creates handlers that are eventually passed to components like CafePanel, AccomodationPanel etc.
  // These components might expect Korean names if their internal 'categoryName' prop is Korean.
  // However, handleConfirmCategoryFn expects an English CategoryName.
  // setShowCategoryResult expects an English CategoryName.
  const createHandleConfirmByCategory = (
    handleConfirmCategoryFn: (category: CategoryName, keywords: string[], clear?: boolean) => void, 
    setShowCategoryResult: (value: CategoryName | null) => void,
    selectedRegions: string[]
  ) => {
    // This returns an object keyed by English CategoryName
    return {
      'accommodation': (finalKeywords: string[]) => {
        console.log(`'accommodation' 카테고리 확인, 키워드: ${finalKeywords.join(', ')}`);
        handleConfirmCategoryFn('accommodation', finalKeywords, true); // Pass English CategoryName
        setShowCategoryResult('accommodation'); // Pass English CategoryName
        if (selectedRegions.length > 0) panTo(selectedRegions[0]);
        return true;
      },
      'attraction': (finalKeywords: string[]) => {
        console.log(`'attraction' 카테고리 확인, 키워드: ${finalKeywords.join(', ')}`);
        handleConfirmCategoryFn('attraction', finalKeywords, true);
        setShowCategoryResult('attraction');
        if (selectedRegions.length > 0) panTo(selectedRegions[0]);
        return true;
      },
      'restaurant': (finalKeywords: string[]) => {
        console.log(`'restaurant' 카테고리 확인, 키워드: ${finalKeywords.join(', ')}`);
        handleConfirmCategoryFn('restaurant', finalKeywords, true);
        setShowCategoryResult('restaurant');
        if (selectedRegions.length > 0) panTo(selectedRegions[0]);
        return true;
      },
      'cafe': (finalKeywords: string[]) => {
        console.log(`'cafe' 카테고리 확인, 키워드: ${finalKeywords.join(', ')}`);
        handleConfirmCategoryFn('cafe', finalKeywords, true);
        setShowCategoryResult('cafe');
        if (selectedRegions.length > 0) panTo(selectedRegions[0]);
        return true;
      }
    } as Record<CategoryName, (finalKeywords: string[]) => boolean>; // Ensure return type matches
  };

  return {
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory,
    createHandleConfirmByCategory
  };
};
