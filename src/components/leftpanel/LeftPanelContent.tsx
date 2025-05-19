
import React from 'react';
import PanelHeader from './PanelHeader';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import { CategoryName, CategoryNameKorean, toCategoryNameKorean } from '@/types'; // Import necessary types

interface LeftPanelContentProps {
  onDateSelect: (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  onCategoryClick: (category: CategoryNameKorean) => void; // Expects Korean name
  regionConfirmed: boolean;
  categoryStepIndex: number;
  activeMiddlePanelCategory: CategoryName | null; // English name from hook
  confirmedCategories: CategoryName[]; // English names from hook
  selectedKeywordsByCategory: Record<string, string[]>; // Key might be English or Korean based on usage
  toggleKeyword: (category: string, keyword: string) => void;
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
  isCategoryButtonEnabled: (category: CategoryNameKorean) => boolean; // Expects Korean name
  isGenerating?: boolean;
}

const LeftPanelContent: React.FC<LeftPanelContentProps> = ({
  onDateSelect,
  onOpenRegionPanel,
  hasSelectedDates,
  onCategoryClick,
  regionConfirmed,
  categoryStepIndex,
  activeMiddlePanelCategory, // English CategoryName or null
  confirmedCategories, // English CategoryName[]
  selectedKeywordsByCategory,
  toggleKeyword,
  directInputValues,
  onDirectInputChange,
  onConfirmCategory,
  handlePanelBack,
  isCategoryButtonEnabled,
  isGenerating,
}) => {
  const koreanCategoryOrder: CategoryNameKorean[] = ["숙소", "관광지", "음식점", "카페"];
  
  // Convert English CategoryNames to Korean for CategoryNavigation
  const koreanConfirmedCategories = confirmedCategories.map(cat => toCategoryNameKorean(cat));
  const koreanActiveMiddlePanelCategory = activeMiddlePanelCategory ? toCategoryNameKorean(activeMiddlePanelCategory) : null;

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
      <PanelHeader 
        onDateSelect={onDateSelect}
        onOpenRegionPanel={onOpenRegionPanel}
        hasSelectedDates={hasSelectedDates}
      />

      <CategoryNavigation
        categoryOrder={koreanCategoryOrder}
        currentCategoryIndex={categoryStepIndex}
        onCategoryClick={onCategoryClick} // Passed directly as it expects Korean
        categorySelectionConfirmed={regionConfirmed} // Assuming regionConfirmed implies category selection can start
        confirmedCategories={koreanConfirmedCategories} // Pass converted Korean names
        isCategoryButtonEnabled={isCategoryButtonEnabled} // Passed directly
        activeMiddlePanelCategory={koreanActiveMiddlePanelCategory} // Pass converted Korean name
      />

      <CategoryPanels
        activeMiddlePanelCategory={activeMiddlePanelCategory} // This component might need English or Korean, check its definition. Assuming English for now.
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
