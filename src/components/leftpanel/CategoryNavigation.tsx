
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
  
  const isButtonEnabled = (index: number) => {
    // 현재 카테고리가 3번째 이상이면 이전 카테고리들도 활성화
    if (currentCategoryIndex >= 2) {
      return index <= currentCategoryIndex + 1;
    }
    // 그 외의 경우 현재와 다음 카테고리만 활성화
    return index === currentCategoryIndex || index === currentCategoryIndex + 1;
  };

  return (
    <div className="mt-6 space-y-2">
      {categoryOrder.map((category, index) => {
        const isActive = index === currentCategoryIndex;
        const isEnabled = isButtonEnabled(index);
        
        return (
          <button
            key={category}
            onClick={() => isEnabled && onCategoryClick(category)}
            className={`
              w-full py-2 rounded border
              ${isActive 
                ? 'bg-white text-black' 
                : isEnabled 
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
