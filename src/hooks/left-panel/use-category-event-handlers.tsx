
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useCategoryResults } from '../use-category-results';
import { Place } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';

/**
 * 카테고리 이벤트 핸들러를 위한 훅
 */
export const useCategoryEventHandlers = (
  refetchFn: () => void,
  setShowCategoryResultFn: (value: CategoryName | null) => void,
  handleConfirmCategoryFn: (category: string | null) => void,
  selectedCategory: string | null
) => {
  // 카테고리 선택 핸들러
  const handleCategorySelect = useCallback((category: string) => {
    console.log(`카테고리 '${category}' 선택됨`);
    // 기존 로직 유지
    refetchFn();
  }, [refetchFn]);

  // 카테고리 결과 닫기 핸들러
  const handleCloseCategoryResult = useCallback(() => {
    console.log("카테고리 결과 화면 닫기");
    setShowCategoryResultFn(null);
  }, [setShowCategoryResultFn]);

  // 카테고리 확인 핸들러
  const handleConfirmCategoryFromButton = useCallback(() => {
    console.log(`카테고리 '${selectedCategory}' 확인 버튼 클릭됨`);
    handleConfirmCategoryFn(selectedCategory);
  }, [selectedCategory, handleConfirmCategoryFn]);

  return {
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategoryFromButton
  };
};
