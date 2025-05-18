
import { useState } from 'react';
import { CategoryName, CategoryKeywords } from '@/utils/categoryUtils';

export const useCategoryKeywords = () => {
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<CategoryKeywords>({
    'accommodation': [],
    'attraction': [],
    'restaurant': [],
    'cafe': [],
  });

  const toggleKeyword = (category: CategoryName, keyword: string) => {
    setSelectedKeywordsByCategory(prev => {
      const keywordsForCategory = prev[category] || [];
      
      if (keywordsForCategory.includes(keyword)) {
        return {
          ...prev,
          [category]: keywordsForCategory.filter(kw => kw !== keyword)
        };
      } else {
        return {
          ...prev,
          [category]: [...keywordsForCategory, keyword]
        };
      }
    });
  };

  const clearKeywordsForCategory = (category: CategoryName) => {
    setSelectedKeywordsByCategory(prev => ({
      ...prev,
      [category]: []
    }));
  };

  return {
    selectedKeywordsByCategory,
    setSelectedKeywordsByCategory,
    toggleKeyword,
    clearKeywordsForCategory, // Added this
  };
};
