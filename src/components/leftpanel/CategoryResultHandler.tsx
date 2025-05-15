
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { Place } from '@/types/supabase';
import type { CategoryName } from '@/utils/categoryUtils'; // Corrected import

interface CategoryResultHandlerProps {
  showCategoryResult: CategoryName | null;
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>; // Consider Record<CategoryName, string[]>
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean, category: CategoryName | null) => void; // Use CategoryName
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
  
  const currentCategory = showCategoryResult;
  // Ensure selectedKeywordsByCategory uses CategoryName as keys if that's the type for currentCategory
  const selectedKeywords = selectedKeywordsByCategory[currentCategory as string] || []; 
  const isPlaceSelected = (id: string | number) => 
    selectedPlaces.some(p => p.id === id);

  const handlePlaceSelection = (place: Place, checked: boolean) => {
    onSelectPlace(place, checked, currentCategory);
  };

  return (
    <CategoryResultPanel
      isOpen={!!showCategoryResult}
      onClose={onClose}
      category={currentCategory}
      regions={selectedRegions}
      keywords={selectedKeywords}
      onSelectPlace={handlePlaceSelection} // This needs to match CategoryResultPanel's onSelectPlace prop
      isPlaceSelected={isPlaceSelected}
    />
  );
};

export default CategoryResultHandler;
