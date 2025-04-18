
import React from 'react';
import CategoryPrioritySelector from './CategoryPrioritySelector';

interface CategoryOrderingStepProps {
  categoryOrder: string[];
  onCategoryClick: (category: string) => void;
  onBackToRegionSelect: () => void;
  onConfirmCategoryOrder: () => void;
  regionConfirmed: boolean;
}

const CategoryOrderingStep: React.FC<CategoryOrderingStepProps> = ({
  categoryOrder,
  onCategoryClick,
  onBackToRegionSelect,
  onConfirmCategoryOrder,
  regionConfirmed
}) => {
  if (!regionConfirmed) return null;
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-800 mb-2">카테고리 중요도 순서 선택</h3>
      <CategoryPrioritySelector
        selectedOrder={categoryOrder}
        onSelect={onCategoryClick}
        onBack={onBackToRegionSelect}
        onConfirm={onConfirmCategoryOrder}
      />
    </div>
  );
};

export default CategoryOrderingStep;
