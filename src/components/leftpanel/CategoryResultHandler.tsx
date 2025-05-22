
import React from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import type { Place } from '@/types/core'; // Using core Place
import type { CategoryName } from '@/utils/categoryUtils';
// Import the specific prop type from the consolidated types file
import type { CategoryResultHandlerProps } from '@/types/left-panel/index';

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  showCategoryResult, // This is CategoryName | null
  selectedRegions,
  selectedKeywordsByCategory, // Record<CategoryName, string[]>
  onClose, // (category: CategoryName) => void
  onSelectPlace, // (place: Place, categoryName: CategoryName) => void
  selectedPlaces,
  onConfirmCategory // (category, selectedFromPanel, recommendedFromPanel) => void; optional
}) => {
  if (!showCategoryResult) return null;
  
  const currentCategory: CategoryName = showCategoryResult; // Explicitly CategoryName
  const selectedKeywords = selectedKeywordsByCategory[currentCategory] || [];
  
  // isPlaceSelected needs to handle string IDs from Place
  const isPlaceSelected = (placeId: string) => 
    selectedPlaces.some(p => String(p.id) === String(placeId));

  const handlePlaceSelection = (place: Place, checked: boolean) => {
    // onSelectPlace from props already expects (place: Place, categoryName: CategoryName)
    // The 'checked' parameter is internal to CategoryResultPanel's onSelectPlace.
    // Here, we just call the prop with the category.
    // Assuming `checked` determines if it's a select or deselect,
    // which should be handled inside `placesManagement.handleSelectPlace`.
    // For now, we adapt by always calling onSelectPlace, the handler itself should know what to do.
    onSelectPlace(place, currentCategory); 
  };

  const handleConfirm = (categoryFromPanel: string, placesFromPanel: Place[], recommendedFromPanel: Place[]) => {
    // Ensure categoryFromPanel is CategoryName if needed, though onConfirmCategory might expect string
    console.log(`[CategoryResultHandler] ${categoryFromPanel} 카테고리 확인됨, 선택된 장소: ${placesFromPanel.length}개`);
    if (onConfirmCategory) {
      onConfirmCategory(categoryFromPanel as CategoryName, placesFromPanel, recommendedFromPanel);
    }
  };

  return (
    <CategoryResultPanel
      isOpen={!!showCategoryResult}
      onClose={() => onClose(currentCategory)} // Pass currentCategory to onClose
      category={currentCategory}
      regions={selectedRegions}
      keywords={selectedKeywords}
      onSelectPlace={handlePlaceSelection} // Passes (place: Place, checked: boolean)
      isPlaceSelected={isPlaceSelected}
      onConfirm={handleConfirm}
    />
  );
};

export default CategoryResultHandler;
