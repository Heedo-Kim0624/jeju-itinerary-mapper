
import React from 'react';
import { Button } from '@/components/ui/button';

interface CategoryNavigationProps {
  categoryOrder: string[];
  currentCategoryIndex: number;
  onCategoryClick: (category: string) => void;
  categorySelectionConfirmed: boolean;
  confirmedCategories: string[];
  isCategoryButtonEnabled: (category: string) => boolean;
  activeMiddlePanelCategory: string | null;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categoryOrder,
  currentCategoryIndex,
  onCategoryClick,
  categorySelectionConfirmed,
  confirmedCategories,
  isCategoryButtonEnabled,
  activeMiddlePanelCategory
}) => {
  if (!categorySelectionConfirmed) return null;

  return (
    <div className="mt-6 space-y-2">
      {categoryOrder.map((category, index) => {
        const isEnabled = isCategoryButtonEnabled(category);
        const isActive = category === activeMiddlePanelCategory;
        const isConfirmed = confirmedCategories.includes(category);
        
        return (
          <button
            key={category}
            onClick={() => isEnabled && onCategoryClick(category)}
            className={`
              w-full py-2 rounded border
              ${isActive ? 'bg-blue-500 text-white' : 
                isConfirmed ? 'bg-green-100 text-green-800' :
                isEnabled ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 
                'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            disabled={!isEnabled}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryNavigation;
