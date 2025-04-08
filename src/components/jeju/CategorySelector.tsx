
import React from 'react';
import { Button } from '@/components/ui/button';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';

interface CategorySelectorProps {
  selectedCategory: string | null;
  isSearchComplete: boolean;
  onCategoryClick: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  isSearchComplete,
  onCategoryClick
}) => {
  const categories = ['restaurant', 'cafe', 'attraction', 'accommodation'];
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map((category) => (
        <Button
          key={category}
          variant="category"
          className={`${
            selectedCategory === category 
              ? categoryColors[category].bg + ' ' + categoryColors[category].text 
              : 'bg-jeju-gray text-jeju-black hover:bg-jeju-gray/80'
          } ${!isSearchComplete ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => onCategoryClick(category)}
          disabled={!isSearchComplete}
        >
          {getCategoryName(category)}
        </Button>
      ))}
    </div>
  );
};

export default CategorySelector;
