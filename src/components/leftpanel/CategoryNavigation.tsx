// src/components/leftpanel/CategoryNavigation.tsx
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
        const isActive = index === currentCategoryIndex;
        return (
          <button
            key={category}
            onClick={() => onCategoryClick(category)}
            className={`w-full py-2 rounded border ${
              isActive
              ? 'bg-white text-black hover:bg-gray-100'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
