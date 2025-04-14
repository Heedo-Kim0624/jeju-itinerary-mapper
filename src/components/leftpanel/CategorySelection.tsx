
import React from 'react';
import CategoryPrioritySelector from './CategoryPrioritySelector';

interface CategorySelectionProps {
  categoryOrder: string[];
  onSelect: (category: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  currentCategoryIndex: number;
  activeCategory: string | null;
  categorySelectionConfirmed: boolean;
  onCategoryClick: (category: string) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  categoryOrder,
  onSelect,
  onBack,
  onConfirm,
  currentCategoryIndex,
  activeCategory,
  categorySelectionConfirmed,
  onCategoryClick
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-800 mb-2">
        카테고리 중요도 순서 선택
      </h3>
      <CategoryPrioritySelector
        selectedOrder={categoryOrder}
        onSelect={onSelect}
        onBack={onBack}
        onConfirm={onConfirm}
      />

      {categorySelectionConfirmed && (
        <div className="mt-6 space-y-2">
          {categoryOrder.map((category, index) => {
            const isCurrent = index === currentCategoryIndex;
            const isConfirmed = index < currentCategoryIndex;
            const disabled = index > currentCategoryIndex;
            return (
              <button
                key={category}
                disabled={disabled}
                onClick={() => onCategoryClick(category)}
                className={`w-full py-2 rounded border ${
                  isCurrent
                    ? 'bg-white text-black hover:bg-gray-100'
                    : isConfirmed
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategorySelection;
