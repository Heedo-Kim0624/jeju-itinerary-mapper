
import React from 'react';
import PanelHeader from './PanelHeader';
import CategoryOrderingStep from './CategoryOrderingStep';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';

interface LeftPanelContentProps {
  onDateSelect: (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  categoryOrder: string[];
  onCategoryClick: (category: string) => void;
  onBackToRegionSelect: () => void;
  onConfirmCategoryOrder: () => void;
  regionConfirmed: boolean;
  categoryStepIndex: number;
  categorySelectionConfirmed: boolean;
  activeMiddlePanelCategory: string | null;
  confirmedCategories: string[];  // Added this prop
  selectedKeywordsByCategory: Record<string, string[]>;
  toggleKeyword: (category: string, keyword: string) => void;
  directInputValues: {
    accomodation: string;
    landmark: string;
    restaurant: string;
    cafe: string;
  };
  onDirectInputChange: {
    accomodation: (value: string) => void;
    landmark: (value: string) => void;
    restaurant: (value: string) => void;
    cafe: (value: string) => void;
  };
  onConfirmCategory: {
    accomodation: (finalKeywords: string[]) => void;
    landmark: (finalKeywords: string[]) => void;
    restaurant: (finalKeywords: string[]) => void;
    cafe: (finalKeywords: string[]) => void;
  };
  handlePanelBack: {
    accomodation: () => void;
    landmark: () => void;
    restaurant: () => void;
    cafe: () => void;
  };
  isCategoryButtonEnabled: (category: string) => boolean;  // Added this prop
}

const LeftPanelContent: React.FC<LeftPanelContentProps> = ({
  onDateSelect,
  onOpenRegionPanel,
  hasSelectedDates,
  categoryOrder,
  onCategoryClick,
  onBackToRegionSelect,
  onConfirmCategoryOrder,
  regionConfirmed,
  categoryStepIndex,
  categorySelectionConfirmed,
  activeMiddlePanelCategory,
  confirmedCategories,  // Added this prop
  selectedKeywordsByCategory,
  toggleKeyword,
  directInputValues,
  onDirectInputChange,
  onConfirmCategory,
  handlePanelBack,
  isCategoryButtonEnabled,  // Added this prop
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
      <PanelHeader 
        onDateSelect={onDateSelect}
        onOpenRegionPanel={onOpenRegionPanel}
        hasSelectedDates={hasSelectedDates}
      />

      <CategoryOrderingStep
        categoryOrder={categoryOrder}
        onCategoryClick={onCategoryClick}
        onBackToRegionSelect={onBackToRegionSelect}
        onConfirmCategoryOrder={onConfirmCategoryOrder}
        regionConfirmed={regionConfirmed}
      />

      <CategoryNavigation
        categoryOrder={categoryOrder}
        currentCategoryIndex={categoryStepIndex}
        onCategoryClick={onCategoryClick}
        categorySelectionConfirmed={categorySelectionConfirmed}
        confirmedCategories={confirmedCategories}  // Added this prop
        isCategoryButtonEnabled={isCategoryButtonEnabled}  // Added this prop
        activeMiddlePanelCategory={activeMiddlePanelCategory}  // Added this prop
      />

      <CategoryPanels
        activeMiddlePanelCategory={activeMiddlePanelCategory}
        selectedKeywordsByCategory={selectedKeywordsByCategory}
        toggleKeyword={toggleKeyword}
        directInputValues={directInputValues}
        onDirectInputChange={onDirectInputChange}
        onConfirmCategory={onConfirmCategory}
        handlePanelBack={handlePanelBack}
      />
    </div>
  );
};

export default LeftPanelContent;
