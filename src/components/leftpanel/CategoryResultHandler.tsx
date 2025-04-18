
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';

interface CategoryResultHandlerProps {
  showCategoryResult: null | '숙소' | '관광지' | '음식점' | '카페';
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  onClose: () => void;
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  showCategoryResult,
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
}) => {
  if (!showCategoryResult) return null;

  return (
    <CategoryResultPanel
      category={showCategoryResult}
      locations={selectedRegions}
      keywords={selectedKeywordsByCategory[showCategoryResult] || []}
      onClose={onClose}
    />
  );
};

export default CategoryResultHandler;
