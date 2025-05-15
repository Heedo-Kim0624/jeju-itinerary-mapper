
// This file is identical to CategoryResultHandler.tsx. This is a duplicate.
// I will assume this file (CategoryResultsPanel.tsx) should be deleted if CategoryResultHandler.tsx is the correct one.
// For now, I will apply a similar fix, but one of them should be removed.
// If CategoryResultsPanel.tsx is indeed a distinct component, its props need specific review.
// Based on the error, it's likely it *is* CategoryResultPanel.tsx that is used.

import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel'; // This seems like self-recursion if CategoryResultsPanel.tsx IS CategoryResultPanel
import { Place } from '@/types/supabase';
import type { CategoryName, MainCategoryName } from '@/utils/categoryUtils';

interface CategoryResultsPanelProps { // Changed name to avoid confusion with the handler
  showCategoryResult: CategoryName | null;
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean, category: string | null) => void;
  selectedPlaces: Place[];
}

const CategoryResultsPanelComponent: React.FC<CategoryResultsPanelProps> = ({ // Changed component name
  showCategoryResult,
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
  onSelectPlace,
  selectedPlaces
}) => {
  if (!showCategoryResult) return null;
  
  const currentCategory = showCategoryResult;
  // Assuming CategoryResultPanel (the one from middlepanel) expects MainCategoryName
  const categoryForPanelDisplay = (currentCategory !== '기타' ? currentCategory : null) as MainCategoryName | null;

  if (!categoryForPanelDisplay) {
     console.warn("CategoryResultsPanel: '기타' category cannot be displayed by the target CategoryResultPanel from middlepanel.");
     return null;
  }

  const selectedKeywords = selectedKeywordsByCategory[currentCategory] || [];
  const isPlaceSelected = (id: string | number) => 
    selectedPlaces.some(p => p.id === id);

  const handlePlaceSelection = (place: Place, checked: boolean) => {
    onSelectPlace(place, checked, currentCategory);
  };

  return (
    <CategoryResultPanel // This is the import from '../middlepanel/CategoryResultPanel'
      isOpen={!!showCategoryResult}
      onClose={onClose}
      category={categoryForPanelDisplay} // Pass validated category
      regions={selectedRegions}
      keywords={selectedKeywords}
      onSelectPlace={handlePlaceSelection}
      isPlaceSelected={isPlaceSelected}
    />
  );
};

export default CategoryResultsPanelComponent; // Changed export name
