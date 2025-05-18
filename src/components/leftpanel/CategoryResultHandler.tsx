
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { Place } from '@/types/supabase';
import type { CategoryName, englishCategoryNameToKorean } from '@/utils/categoryUtils'; // Added englishCategoryNameToKorean

interface CategoryResultHandlerProps {
  showCategoryResult: CategoryName | null; // This is English CategoryName
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<CategoryName, string[]>; // Keys are English CategoryName
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean, category: CategoryName | null) => void; // category is English CategoryName
  selectedPlaces: Place[]; // Assuming Place type here, not SelectedPlace
  onConfirmCategory?: (category: CategoryName, selectedPlaces: Place[], recommendedPlaces: Place[]) => void; // category is English
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  showCategoryResult,
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
  onSelectPlace,
  selectedPlaces,
  onConfirmCategory
}) => {
  if (!showCategoryResult) return null;
  
  const currentCategoryEnglish = showCategoryResult; // This is English CategoryName
  // CategoryResultPanel prop 'category' might expect Korean for display.
  // Let's assume CategoryResultPanel's 'category' prop is for internal logic or display.
  // If it's for display, it should be converted. If for logic, it should be English.
  // For now, we pass the English name. The panel might use englishCategoryNameToKorean internally.
  const currentCategoryForPanel = currentCategoryEnglish; 

  const selectedKeywords = selectedKeywordsByCategory[currentCategoryEnglish] || [];
  const isPlaceSelected = (id: string | number) => 
    selectedPlaces.some(p => p.id === id);

  const handlePlaceSelection = (place: Place, checked: boolean) => {
    // Pass English CategoryName to onSelectPlace
    onSelectPlace(place, checked, currentCategoryEnglish);
  };

  const handleConfirm = (
    // CategoryResultPanel onConfirm might pass the category it knows (e.g. from its 'category' prop)
    // Assuming it passes the same category it received, which is currentCategoryForPanel (English)
    categoryFromPanel: CategoryName, 
    confirmedSelectedPlaces: Place[], // Assuming Place[]
    recommendedPlacesFromPanel: Place[] // Assuming Place[]
    ) => {
    console.log(`[CategoryResultHandler] ${englishCategoryNameToKorean(categoryFromPanel)} (${categoryFromPanel}) 카테고리 확인됨, 선택된 장소: ${confirmedSelectedPlaces.length}개`);
    if (onConfirmCategory) {
      // Pass English CategoryName to onConfirmCategory
      onConfirmCategory(categoryFromPanel, confirmedSelectedPlaces, recommendedPlacesFromPanel);
    }
  };

  return (
    <CategoryResultPanel
      isOpen={!!showCategoryResult}
      onClose={onClose}
      category={currentCategoryForPanel} // Pass English CategoryName
      regions={selectedRegions}
      keywords={selectedKeywords}
      onSelectPlace={handlePlaceSelection}
      isPlaceSelected={isPlaceSelected}
      onConfirm={handleConfirm}
    />
  );
};

export default CategoryResultHandler;
