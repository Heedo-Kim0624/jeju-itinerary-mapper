
import React from 'react';
import PanelHeader from './PanelHeader';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import { CategoryName, CategoryNameKorean, toCategoryNameKorean, toCategoryName } from '@/types'; // Import necessary types

interface LeftPanelContentProps {
  onDateSelect: (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  onCategoryClick: (category: CategoryNameKorean) => void; 
  regionConfirmed: boolean;
  categoryStepIndex: number;
  activeMiddlePanelCategory: CategoryName | null; 
  confirmedCategories: CategoryName[]; 
  selectedKeywordsByCategory: Record<CategoryName, string[]>; // Key is English CategoryName
  toggleKeyword: (category: CategoryName, keyword: string) => void; // Expects English CategoryName
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
  isCategoryButtonEnabled: (category: CategoryNameKorean) => boolean; 
  isGenerating?: boolean;
}

const LeftPanelContent: React.FC<LeftPanelContentProps> = ({
  onDateSelect,
  onOpenRegionPanel,
  hasSelectedDates,
  onCategoryClick,
  regionConfirmed,
  categoryStepIndex,
  activeMiddlePanelCategory, 
  confirmedCategories, 
  selectedKeywordsByCategory, // Keys are English
  toggleKeyword, // Expects English CategoryName
  directInputValues,
  onDirectInputChange,
  onConfirmCategory,
  handlePanelBack,
  isCategoryButtonEnabled,
  isGenerating,
}) => {
  const koreanCategoryOrder: CategoryNameKorean[] = ["숙소", "관광지", "음식점", "카페"];
  
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
        currentCategoryIndex={categoryStepIndex} // This is English based index
        onCategoryClick={onCategoryClick} 
        categorySelectionConfirmed={regionConfirmed} 
        confirmedCategories={koreanConfirmedCategories} 
        isCategoryButtonEnabled={isCategoryButtonEnabled} 
        activeMiddlePanelCategory={koreanActiveMiddlePanelCategory}
      />

      <CategoryPanels
        activeMiddlePanelCategory={activeMiddlePanelCategory} // Pass English CategoryName
        selectedKeywordsByCategory={selectedKeywordsByCategory} // Pass Record<CategoryName, string[]>
        toggleKeyword={toggleKeyword} // Pass (category: CategoryName, keyword: string) => void
        directInputValues={directInputValues}
        onDirectInputChange={onDirectInputChange}
        onConfirmCategory={onConfirmCategory}
        handlePanelBack={handlePanelBack}
      />
    </div>
  );
};

export default LeftPanelContent;
