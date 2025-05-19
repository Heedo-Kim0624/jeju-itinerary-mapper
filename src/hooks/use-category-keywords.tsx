
import { useState } from 'react';
// Removed CategoryName import from '@/utils/categoryUtils'
import { CategoryName, CategoryNameKorean, toCategoryName, toCategoryNameKorean } // Assuming CategoryName is English
from '@/types';
import { categoryKeywords as defaultCategoryKeywords } from '@/utils/categoryUtils'; // This is Record<CategoryNameKorean, string[]>

export const useCategoryKeywords = () => {
  // Store keywords with English CategoryName as key for consistency if activeMiddlePanelCategory is English
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<CategoryName, string[]>>({
    accommodation: [],
    landmark: [],
    restaurant: [],
    cafe: [],
  });

  // toggleKeyword expects the category key to be English CategoryName
  const toggleKeyword = (category: CategoryName, keyword: string) => {
    setSelectedKeywordsByCategory((prev) => {
      const currentKeywords = prev[category] || [];
      const newKeywords = currentKeywords.includes(keyword)
        ? currentKeywords.filter((kw) => kw !== keyword)
        : [...currentKeywords, keyword];
      return { ...prev, [category]: newKeywords };
    });
  };
  
  // If you need to get default keywords for a category (e.g. for LandmarkPanel),
  // you'd convert the English CategoryName to Korean to access defaultCategoryKeywords.
  const getDefaultKeywordsForCategory = (category: CategoryName): string[] => {
    const koreanCategory = toCategoryNameKorean(category);
    return defaultCategoryKeywords[koreanCategory] || [];
  };


  return {
    selectedKeywordsByCategory, // Keys are English CategoryName
    setSelectedKeywordsByCategory, // Expects English CategoryName as key
    toggleKeyword, // Expects English CategoryName as first arg
    getDefaultKeywordsForCategory, // Expects English CategoryName
  };
};
