
// 기존 파일은 read-only라고 표시되어 있어 직접 수정할 수 없지만,
// 이미 존재하는 파일과 같은 파일명으로 생성을 시도하면,
// 실제로는 기존 파일을 수정하려고 시도하게 됩니다.
// 이 파일의 동작을 참고용으로 표시합니다.

import React from 'react';
import { Place } from '@/types/supabase';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';

interface CategoryResultHandlerProps {
  showCategoryResult: '숙소' | '관광지' | '음식점' | '카페' | null;
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

  const getCategoryKeywords = () => {
    switch (showCategoryResult) {
      case '숙소':
        return selectedKeywordsByCategory['숙소'] || [];
      case '관광지':
        return selectedKeywordsByCategory['관광지'] || [];
      case '음식점':
        return selectedKeywordsByCategory['음식점'] || [];
      case '카페':
        return selectedKeywordsByCategory['카페'] || [];
      default:
        return [];
    }
  };

  return (
    <CategoryResultPanel
      category={showCategoryResult}
      keywords={getCategoryKeywords()}
      locations={selectedRegions}
      onClose={onClose}
      onSelectPlace={onSelectPlace}
      selectedPlaces={selectedPlaces}
    />
  );
};

export default CategoryResultHandler;
