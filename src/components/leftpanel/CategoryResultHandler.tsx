
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { Place } from '@/types/supabase';

interface CategoryResultHandlerProps {
  showCategoryResult: string | null;
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean) => void;
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

  const category = showCategoryResult as '숙소' | '관광지' | '음식점' | '카페';
  const keywords = selectedKeywordsByCategory[category] || [];

  return (
    <CategoryResultPanel
      category={category}
      locations={selectedRegions}
      keywords={keywords}
      onClose={onClose}
      onSelectPlace={onSelectPlace}
      selectedPlaces={selectedPlaces}
    />
  );
};

export default CategoryResultHandler;
