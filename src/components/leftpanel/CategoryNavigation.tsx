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
    // 현재 카테고리와 그 이전의 모든 카테고리는 활성화
    if (index <= currentCategoryIndex) {
      return true;
    }
    // 나머지 모든 카테고리는 비활성화
    return false;
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
