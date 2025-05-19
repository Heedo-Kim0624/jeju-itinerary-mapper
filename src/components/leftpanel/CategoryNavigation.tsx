
import React from 'react';
import { Button } from '@/components/ui/button';
import { CategoryName, CategoryNameKorean } from '@/types'; // Import both if needed, or just CategoryNameKorean if all ops are Korean-based

interface CategoryNavigationProps {
  categoryOrder: CategoryNameKorean[]; // Expecting Korean names for display and order
  currentCategoryIndex: number; // This might not be needed if activeMiddlePanelCategory is used
  onCategoryClick: (category: CategoryNameKorean) => void; // Passes Korean name back
  categorySelectionConfirmed: boolean;
  confirmedCategories: CategoryNameKorean[]; // List of confirmed Korean category names
  isCategoryButtonEnabled: (category: CategoryNameKorean) => boolean; // Checks based on Korean name
  activeMiddlePanelCategory: CategoryNameKorean | null; // Active category is Korean name
  // Removed props that seemed out of place for a navigation component based on user's previous prompt changes
  // setShowCategoryResult, showCategoryResult, directInputValues, onDirectInputChange, handleConfirmCategory
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  categoryOrder,
  // currentCategoryIndex, // Not used
  onCategoryClick,
  categorySelectionConfirmed,
  confirmedCategories,
  isCategoryButtonEnabled,
  activeMiddlePanelCategory
}) => {
  if (!categorySelectionConfirmed) return null;

  const renderCategoryButton = (category: CategoryNameKorean, index: number) => {
    const isEnabled = isCategoryButtonEnabled(category);
    const isActive = category === activeMiddlePanelCategory;
    const isConfirmed = confirmedCategories.includes(category);
    
    return (
      <button
        key={category}
        onClick={() => isEnabled && onCategoryClick(category)}
        className={`
          py-2 rounded border
          ${isActive ? 'bg-blue-500 text-white' : 
            isConfirmed ? 'bg-green-100 text-green-800' :
            isEnabled ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 
            'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
        `}
        disabled={!isEnabled}
      >
        {category} {/* Display Korean name */}
      </button>
    );
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-2">
        {categoryOrder.map((category, index) => renderCategoryButton(category, index))}
      </div>
    </div>
  );
};

export default CategoryNavigation;
