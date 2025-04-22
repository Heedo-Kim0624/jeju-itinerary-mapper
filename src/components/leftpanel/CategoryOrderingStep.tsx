
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
