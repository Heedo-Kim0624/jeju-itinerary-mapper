
import { useState, useCallback } from 'react';
import { CategoryKeywords, getCategoryEnglish } from '@/utils/categoryUtils';

export const useCategoryKeywords = () => {
  // 카테고리별 선택된 키워드를 관리하는 상태
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<CategoryKeywords>({
    restaurant: [],
    cafe: [],
    attraction: [],
    accommodation: [],
    landmark: []
  });

  // 키워드 토글 함수
  const toggleKeyword = useCallback((category: string, keyword: string) => {
    const engCategory = getCategoryEnglish(category) as keyof CategoryKeywords;
    
    // 카테고리가 유효한지 확인
    if (!selectedKeywordsByCategory[engCategory]) {
      console.warn(`알 수 없는 카테고리: ${category} (${engCategory})`);
      return;
    }

    setSelectedKeywordsByCategory(prev => {
      const keywords = prev[engCategory];
      const isSelected = keywords.includes(keyword);
      
      return {
        ...prev,
        [engCategory]: isSelected
          ? keywords.filter(k => k !== keyword)
          : [...keywords, keyword]
      };
    });
  }, [selectedKeywordsByCategory]);

  // 카테고리의 키워드 일괄 설정 함수
  const setKeywords = useCallback((category: string, keywords: string[]) => {
    const engCategory = getCategoryEnglish(category) as keyof CategoryKeywords;
    
    if (!selectedKeywordsByCategory[engCategory]) {
      console.warn(`알 수 없는 카테고리: ${category} (${engCategory})`);
      return;
    }

    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [engCategory]: [...keywords]
    }));
  }, [selectedKeywordsByCategory]);

  // 카테고리의 모든 키워드 삭제 함수
  const clearKeywords = useCallback((category: string) => {
    const engCategory = getCategoryEnglish(category) as keyof CategoryKeywords;
    
    if (!selectedKeywordsByCategory[engCategory]) {
      console.warn(`알 수 없는 카테고리: ${category} (${engCategory})`);
      return;
    }

    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [engCategory]: []
    }));
  }, [selectedKeywordsByCategory]);

  return {
    selectedKeywordsByCategory,
    toggleKeyword,
    setKeywords,
    clearKeywords
  };
};
