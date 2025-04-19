
// src/components/leftpanel/CategoryResultHandler.tsx
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

  // 카테고리에 맞는 키워드 배열을 가져옵니다.
  // 없으면 빈 배열을 기본값으로 사용합니다.
  const keywords = selectedKeywordsByCategory[showCategoryResult] || [];

  return (
    <CategoryResultPanel
      category={showCategoryResult}
      locations={selectedRegions}
      keywords={keywords}
      onClose={onClose}
    />
  );
};

export default CategoryResultHandler;
