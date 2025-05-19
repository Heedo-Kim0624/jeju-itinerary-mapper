
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { Place, CategoryName, SelectedPlace as GlobalSelectedPlace } from '@/types'; // Renamed SelectedPlace to avoid conflict if any, and import CategoryName
// import type { CategoryName } from '@/utils/categoryUtils'; // This was old, using from @/types

interface CategoryResultHandlerProps {
  showCategoryResult: CategoryName | null;
  selectedRegions: string[];
  selectedKeywords: string[]; // Added this prop
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean, category: string | null) => void;
  selectedPlaces: GlobalSelectedPlace[]; // Use imported GlobalSelectedPlace
  onConfirmCategory?: (category: CategoryName, selectedPlaces: Place[], recommendedPlaces: Place[]) => void;
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  showCategoryResult,
  selectedRegions,
  selectedKeywords, // Use this prop
  onClose,
  onSelectPlace,
  selectedPlaces,
  onConfirmCategory
}) => {
  if (!showCategoryResult) return null;
  
  const currentCategory = showCategoryResult;
  // selectedKeywords is now directly passed as a prop
  // const selectedKeywords = selectedKeywordsByCategory[currentCategory] || [];
  const isPlaceSelected = (id: string | number) => 
    selectedPlaces.some(p => p.id === id);

  const handlePlaceSelection = (place: Place, checked: boolean) => {
    // 카테고리 정보를 함께 전달하여 장소 선택 처리
    onSelectPlace(place, checked, currentCategory);
  };

  const handleConfirm = (category: CategoryName, currentSelectedPlaces: Place[], recommendedPlaces: Place[]) => {
    console.log(`[CategoryResultHandler] ${category} 카테고리 확인됨 및 자동 보완 시작, 선택된 장소: ${currentSelectedPlaces.length}개`);
    if (onConfirmCategory) {
      onConfirmCategory(category, currentSelectedPlaces, recommendedPlaces);
    }
  };

  return (
    <CategoryResultPanel
      isOpen={!!showCategoryResult}
      onClose={onClose}
      category={currentCategory} // This is CategoryName
      regions={selectedRegions}
      keywords={selectedKeywords} // Pass the prop here
      onSelectPlace={handlePlaceSelection}
      isPlaceSelected={isPlaceSelected}
      onConfirm={handleConfirm} // Ensure this signature matches CategoryResultPanel's onConfirm
    />
  );
};

export default CategoryResultHandler;
