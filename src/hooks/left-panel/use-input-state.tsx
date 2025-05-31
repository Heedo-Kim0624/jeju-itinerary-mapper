
import { useState, useCallback } from 'react';
import type { CategoryName } from '@/types';

export const useInputState = () => {
  const [directInputValues, setDirectInputValues] = useState<Record<CategoryName, string>>({
    '숙소': '',
    '관광지': '',
    '음식점': '',
    '카페': '',
  });

  const [customKeywords, setCustomKeywords] = useState<Record<CategoryName, string[]>>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
  });

  const onDirectInputChange = useCallback((category: CategoryName, value: string) => {
    setDirectInputValues(prev => ({
      ...prev,
      [category]: value
    }));
  }, []);

  const addCustomKeyword = useCallback((category: CategoryName, keyword: string) => {
    if (keyword.trim() && !customKeywords[category].includes(keyword.trim())) {
      setCustomKeywords(prev => ({
        ...prev,
        [category]: [...prev[category], keyword.trim()]
      }));
      // Clear input after adding
      setDirectInputValues(prev => ({
        ...prev,
        [category]: ''
      }));
    }
  }, [customKeywords]);

  const removeCustomKeyword = useCallback((category: CategoryName, keyword: string) => {
    setCustomKeywords(prev => ({
      ...prev,
      [category]: prev[category].filter(k => k !== keyword)
    }));
  }, []);

  // Filter function to exclude custom keywords from Supabase queries
  const filterKeywordsForQuery = useCallback((category: CategoryName, allKeywords: string[]) => {
    const customCategoryKeywords = customKeywords[category];
    return allKeywords.filter(keyword => !customCategoryKeywords.includes(keyword));
  }, [customKeywords]);

  return {
    directInputValues,
    customKeywords,
    onDirectInputChange,
    addCustomKeyword,
    removeCustomKeyword,
    filterKeywordsForQuery,
  };
};
