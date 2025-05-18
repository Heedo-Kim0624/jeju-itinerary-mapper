
import React from 'react';
import AccomodationPanel from '../middlepanel/AccomodationPanel';
import LandmarkPanel from '../middlepanel/LandmarkPanel';
import RestaurantPanel from '../middlepanel/RestaurantPanel';
import CafePanel from '../middlepanel/CafePanel';
import { CategoryName } from '@/utils/categoryUtils';

interface CategoryPanelsProps {
  activeMiddlePanelCategory: CategoryName | null; // English CategoryName
  selectedKeywordsByCategory: Record<CategoryName, string[]>; // Keys are English CategoryName
  toggleKeyword: (category: CategoryName, keyword: string) => void; // category is English CategoryName
  directInputValues: Record<CategoryName, string>; // Keys are English CategoryName
  onDirectInputChange: Record<CategoryName, (value: string) => void>; // Keys are English CategoryName
  onConfirmCategory: Record<CategoryName, (finalKeywords: string[]) => void>; // Keys are English CategoryName
  handlePanelBack: Record<CategoryName, () => void>; // Keys are English CategoryName
}

const CategoryPanels: React.FC<CategoryPanelsProps> = ({
  activeMiddlePanelCategory,
  selectedKeywordsByCategory,
  toggleKeyword,
  directInputValues,
  onDirectInputChange,
  onConfirmCategory,
  handlePanelBack,
}) => {
  return (
    <>
      {activeMiddlePanelCategory === 'accommodation' && (
        <AccomodationPanel
          selectedKeywords={selectedKeywordsByCategory['accommodation'] || []}
          onToggleKeyword={(kw) => toggleKeyword('accommodation', kw)}
          directInputValue={directInputValues.accommodation}
          onDirectInputChange={onDirectInputChange.accommodation}
          onConfirmAccomodation={(kw) => onConfirmCategory.accommodation(kw)}
          onClose={() => handlePanelBack.accommodation()}
        />
      )}

      {activeMiddlePanelCategory === 'attraction' && (
        <LandmarkPanel
          selectedKeywords={selectedKeywordsByCategory['attraction'] || []}
          onToggleKeyword={(kw) => toggleKeyword('attraction', kw)}
          directInputValue={directInputValues.attraction}
          onDirectInputChange={onDirectInputChange.attraction}
          onConfirmLandmark={(kw) => onConfirmCategory.attraction(kw)}
          onClose={() => handlePanelBack.attraction()}
        />
      )}

      {activeMiddlePanelCategory === 'restaurant' && (
        <RestaurantPanel
          selectedKeywords={selectedKeywordsByCategory['restaurant'] || []}
          onToggleKeyword={(kw) => toggleKeyword('restaurant', kw)}
          directInputValue={directInputValues.restaurant}
          onDirectInputChange={onDirectInputChange.restaurant}
          onConfirmRestaurant={(kw) => onConfirmCategory.restaurant(kw)}
          onClose={() => handlePanelBack.restaurant()}
        />
      )}

      {activeMiddlePanelCategory === 'cafe' && (
        <CafePanel
          selectedKeywords={selectedKeywordsByCategory['cafe'] || []}
          onToggleKeyword={(kw) => toggleKeyword('cafe', kw)}
          directInputValue={directInputValues.cafe}
          onDirectInputChange={onDirectInputChange.cafe}
          onConfirmCafe={(kw) => onConfirmCategory.cafe(kw)}
          onClose={() =>handlePanelBack.cafe()}
        />
      )}
    </>
  );
};

export default CategoryPanels;
