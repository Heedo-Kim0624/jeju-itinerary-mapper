
import React from 'react';
import AccomodationPanel from '../middlepanel/AccomodationPanel'; // This component name might need to be AccommodationPanel
import LandmarkPanel from '../middlepanel/LandmarkPanel';
import RestaurantPanel from '../middlepanel/RestaurantPanel';
import CafePanel from '../middlepanel/CafePanel';
import { CategoryName, toCategoryNameKorean } from '@/types'; // Import CategoryName for keys

interface CategoryPanelsProps {
  activeMiddlePanelCategory: CategoryName | null; // Expect English CategoryName
  selectedKeywordsByCategory: Record<CategoryName, string[]>; // Expect English CategoryName keys
  toggleKeyword: (category: CategoryName, keyword: string) => void; // Expect English CategoryName
  directInputValues: {
    accommodation: string; // Corrected spelling
    landmark: string;
    restaurant: string;
    cafe: string;
  };
  onDirectInputChange: {
    accommodation: (value: string) => void; // Corrected spelling
    landmark: (value: string) => void;
    restaurant: (value: string) => void;
    cafe: (value: string) => void;
  };
  onConfirmCategory: {
    accommodation: (finalKeywords: string[]) => void; // Corrected spelling
    landmark: (finalKeywords: string[]) => void;
    restaurant: (finalKeywords: string[]) => void;
    cafe: (finalKeywords: string[]) => void;
  };
  handlePanelBack: {
    accommodation: () => void; // Corrected spelling
    landmark: () => void;
    restaurant: () => void;
    cafe: () => void;
  };
}

const CategoryPanels: React.FC<CategoryPanelsProps> = ({
  activeMiddlePanelCategory, // This is English: 'accommodation', 'landmark', etc.
  selectedKeywordsByCategory,
  toggleKeyword,
  directInputValues,
  onDirectInputChange,
  onConfirmCategory,
  handlePanelBack,
}) => {
  // The individual panels (AccomodationPanel, LandmarkPanel etc.) internally
  // might use Korean display names or English keywords.
  // Here, we map the English activeMiddlePanelCategory to the correct panel
  // and pass props using the English keys.

  return (
    <>
      {activeMiddlePanelCategory === 'accommodation' && (
        <AccomodationPanel // Assuming AccomodationPanel is the correct component name
          selectedKeywords={selectedKeywordsByCategory['accommodation'] || []}
          onToggleKeyword={(kw) => toggleKeyword('accommodation', kw)}
          directInputValue={directInputValues.accommodation}
          onDirectInputChange={onDirectInputChange.accommodation}
          onConfirmAccomodation={(kw) => onConfirmCategory.accommodation(kw)}
          onClose={() => handlePanelBack.accommodation()}
        />
      )}

      {activeMiddlePanelCategory === 'landmark' && (
        <LandmarkPanel
          selectedKeywords={selectedKeywordsByCategory['landmark'] || []}
          onToggleKeyword={(kw) => toggleKeyword('landmark', kw)}
          directInputValue={directInputValues.landmark}
          onDirectInputChange={onDirectInputChange.landmark}
          onConfirmLandmark={(kw) => onConfirmCategory.landmark(kw)}
          onClose={() => handlePanelBack.landmark()}
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
