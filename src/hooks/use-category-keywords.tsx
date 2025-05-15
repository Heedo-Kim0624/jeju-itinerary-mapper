
import { useState } from 'react';

export interface CategoryKeywords {
  '숙소': string[];
  '관광지': string[];
  '음식점': string[];
  '카페': string[];
  [category: string]: string[];  // Add index signature
}

export const useCategoryKeywords = () => {
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<CategoryKeywords>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': []
  });

  const toggleKeyword = (category: string, keyword: string) => {
    setSelectedKeywordsByCategory(prev => {
      const currentKeywords = prev[category] || [];
      const updatedKeywords = currentKeywords.includes(keyword)
        ? currentKeywords.filter(k => k !== keyword)
        : [...currentKeywords, keyword];
      
      return {
        ...prev,
        [category]: updatedKeywords
      };
    });
  };

  const setKeywords = (category: string, keywords: string[]) => {
    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [category]: keywords
    }));
  };

  const clearKeywords = (category: string) => {
    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [category]: []
    }));
  };

  return {
    selectedKeywordsByCategory,
    toggleKeyword,
    setKeywords,
    clearKeywords,
    setSelectedKeywordsByCategory  // Add this to expose the function
  };
};
