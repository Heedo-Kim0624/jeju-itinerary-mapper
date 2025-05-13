
import { useEffect } from 'react';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { usePlaces } from '@/hooks/use-places';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useState } from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { Place } from '@/types/supabase';

interface CategoryResultHandlerProps {
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  onClose: () => void;
  onSelectPlace: (place: any, checked: boolean, category: string) => void;
  selectedPlaces: any[];
  showCategoryResult: boolean;
  onPlacesLoaded?: (category: string, places: Place[]) => void;
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
  onSelectPlace,
  selectedPlaces,
  showCategoryResult,
  onPlacesLoaded
}) => {
  const { activeMiddlePanelCategory, handlePanelBack } = useCategorySelection();
  
  // 선택된 장소의 ID 매핑
  const isPlaceSelected = (placeId: string | number) => {
    return selectedPlaces.some(place => place.id === placeId);
  };

  return showCategoryResult && activeMiddlePanelCategory ? (
    <CategoryResultPanel
      category={activeMiddlePanelCategory as '숙소' | '관광지' | '음식점' | '카페'}
      regions={selectedRegions}
      keywords={selectedKeywordsByCategory[activeMiddlePanelCategory] || []}
      onClose={() => {
        handlePanelBack();
        onClose();
      }}
      onSelectPlace={(place, checked) => 
        onSelectPlace(place, checked, activeMiddlePanelCategory)
      }
      isPlaceSelected={isPlaceSelected}
      isOpen={showCategoryResult}
      onDataLoaded={onPlacesLoaded}
    />
  ) : null;
};

export default CategoryResultHandler;
