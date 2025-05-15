
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { Place } from '@/types/supabase';
import type { CategoryName, MainCategoryName } from '@/utils/categoryUtils';

interface CategoryResultHandlerProps {
  showCategoryResult: CategoryName | null;
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean, category: string | null) => void;
  selectedPlaces: Place[];
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  showCategoryResult,
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
  onSelectPlace,
  selectedPlaces
}) => {
  if (!showCategoryResult) return null;
  
  // Ensure currentCategory is one of the MainCategoryName types for CategoryResultPanel
  // This is a common pattern if CategoryResultPanel doesn't handle '기타'
  // If CategoryResultPanel *can* handle '기타', this check can be simpler or removed.
  const currentCategory = showCategoryResult;
  const categoryForPanel = (showCategoryResult !== '기타' ? showCategoryResult : null) as MainCategoryName | null;

  if (!categoryForPanel) {
    // Decide how to handle '기타' - perhaps show a different panel or a message.
    // For now, we'll prevent rendering if it's '기타' and CategoryResultPanel can't handle it.
    console.warn("CategoryResultHandler: '기타' category cannot be displayed by CategoryResultPanel in its current form.");
    return null; 
  }
  
  const selectedKeywords = selectedKeywordsByCategory[currentCategory] || [];
  const isPlaceSelected = (id: string | number) => 
    selectedPlaces.some(p => p.id === id);

  const handlePlaceSelection = (place: Place, checked: boolean) => {
    onSelectPlace(place, checked, currentCategory);
  };

  return (
    <CategoryResultPanel
      isOpen={!!showCategoryResult}
      onClose={onClose}
      category={categoryForPanel} // Pass the validated category
      regions={selectedRegions}
      keywords={selectedKeywords}
      onSelectPlace={handlePlaceSelection}
      isPlaceSelected={isPlaceSelected}
    />
  );
};

export default CategoryResultHandler;
