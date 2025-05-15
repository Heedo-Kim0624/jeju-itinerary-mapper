import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { Place } from '@/types/supabase';
import type { CategoryName } from '@/utils/categoryUtils';

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
  
  const currentCategory = showCategoryResult;
  const selectedKeywords = selectedKeywordsByCategory[currentCategory] || [];
  const isPlaceSelected = (id: string | number) => 
    selectedPlaces.some(p => p.id === id);

  const handlePlaceSelection = (place: Place, checked: boolean) => {
    // 카테고리 정보를 함께 전달하여 장소 선택 처리
    onSelectPlace(place, checked, currentCategory);
  };

  return (
    <CategoryResultPanel
      isOpen={!!showCategoryResult}
      onClose={onClose}
      category={currentCategory}
      regions={selectedRegions}
      keywords={selectedKeywords}
      onSelectPlace={handlePlaceSelection}
      isPlaceSelected={isPlaceSelected}
    />
  );
};

export default CategoryResultHandler;
