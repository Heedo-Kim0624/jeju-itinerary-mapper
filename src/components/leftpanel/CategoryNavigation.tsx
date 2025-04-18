
import React from 'react';

interface CategoryNavigationProps {
  categoryOrder: string[];
  currentCategoryIndex: number;
  onCategoryClick: (category: string) => void;
  categorySelectionConfirmed: boolean;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categoryOrder,
  currentCategoryIndex,
  onCategoryClick,
  categorySelectionConfirmed
}) => {
  if (!categorySelectionConfirmed) return null;
  
  return (
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
  );
};

export default CategoryNavigation;
