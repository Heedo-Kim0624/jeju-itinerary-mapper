
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place, CategoryName } from '@/types';

/**
 * Provides handlers for category result operations
 */
export const useCategoryResultHandlers = (
  selectedRegions: string[],
  tripDetails: { tripDuration: number | null },
  handleAutoCompletePlaces: (category: CategoryName, recommendedPool: Place[], actualTravelDays: number) => void,
  setShowCategoryResult: (category: CategoryName | null) => void
) => {
  /**
   * Handles the confirmation of a category with selected places and auto-completion
   */
  const handleConfirmCategoryWithAutoComplete = useCallback((
    category: CategoryName,
    userSelectedInPanel: Place[],
    recommendedPoolForCategory: Place[]
  ) => {
    const nDaysInNights = tripDetails.tripDuration;

    console.log(
      `[useCategoryResultHandlers] '${category}' 카테고리 결과 확인. 사용자가 패널에서 선택: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
    );

    if (nDaysInNights === null) {
      console.warn("[useCategoryResultHandlers] 여행 기간(tripDuration)이 null입니다. 자동 보완을 실행할 수 없습니다.");
      toast.error("여행 기간을 먼저 설정해주세요. 날짜 선택 후 다시 시도해주세요.");
      setShowCategoryResult(null); 
      return;
    }

    const actualTravelDays = nDaysInNights + 1;
    console.log(`[useCategoryResultHandlers] 계산된 총 여행일수: ${actualTravelDays}일`);

    if (actualTravelDays <= 0) {
      console.warn(`[useCategoryResultHandlers] 총 여행일수(${actualTravelDays}일)가 유효하지 않아 자동 보완을 실행할 수 없습니다.`);
      toast.error("여행 기간이 올바르게 설정되지 않았습니다. 날짜를 다시 확인해주세요.");
      setShowCategoryResult(null);
      return;
    }
    
    handleAutoCompletePlaces(
      category,
      recommendedPoolForCategory,
      actualTravelDays
    );
    
    setShowCategoryResult(null);
  }, [tripDetails, selectedRegions, handleAutoCompletePlaces, setShowCategoryResult]);

  /**
   * Handles the confirmation of category keywords selection
   */
  const handleConfirmCategoryKeywordSelection = useCallback((
    category: CategoryName, 
    finalKeywords: string[],
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean) => void
  ) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    handleConfirmCategory(category, finalKeywords, true); // true to show category result panel
    return true;
  }, []);

  /**
   * Handles closing the category result panel
   */
  const handleResultClose = useCallback(() => {
    console.log("카테고리 결과 화면 닫기");
    setShowCategoryResult(null);
  }, [setShowCategoryResult]);

  return {
    handleConfirmCategoryWithAutoComplete,
    handleConfirmCategoryKeywordSelection,
    handleResultClose
  };
};
