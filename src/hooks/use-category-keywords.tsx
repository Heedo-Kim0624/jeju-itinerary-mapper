
import { useState } from 'react';
import { CategoryName, CategoryKeywords } from '@/utils/categoryUtils'; // Ensure these are exported

export const useCategoryKeywords = () => {
  // Initialize with all CategoryName keys
  const initialKeywords: CategoryKeywords = {
    'accommodation': [],
    'landmark': [],
    'restaurant': [],
    'cafe': [],
    'attraction': [], // Add if 'attraction' is a distinct CategoryName
  };
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<CategoryKeywords>(initialKeywords);

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

  return {
    selectedKeywordsByCategory,
    setSelectedKeywordsByCategory,
    toggleKeyword,
  };
};
