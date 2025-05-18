
import React from 'react';
import PanelHeader from './PanelHeader';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import { CategoryName, englishCategoryNameToKorean } from '@/utils/categoryUtils'; // Added englishCategoryNameToKorean

interface LeftPanelContentProps {
  currentPanel: 'region' | 'date' | 'category' | 'itinerary'; // Added currentPanel
  onDateSelect: (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  onCategoryClick: (category: CategoryName) => void; // Changed string to CategoryName
  regionConfirmed: boolean;
  categoryStepIndex: number;
  activeMiddlePanelCategory: CategoryName | null; // Changed string to CategoryName
  confirmedCategories: CategoryName[]; // Changed string[] to CategoryName[]
  selectedKeywordsByCategory: Record<CategoryName, string[]>; // Key to CategoryName
  toggleKeyword: (category: CategoryName, keyword: string) => void; // category to CategoryName
  directInputValues: Record<CategoryName, string>; // Key to CategoryName, e.g. directInputValues.accommodation
  onDirectInputChange: Record<CategoryName, (value: string) => void>; // Key to CategoryName
  onConfirmCategory: Record<CategoryName, (finalKeywords: string[]) => void>; // Key to CategoryName
  handlePanelBack: Record<CategoryName, () => void>; // Key to CategoryName
  isCategoryButtonEnabled: (category: CategoryName) => boolean; // category to CategoryName
  // Props from useLeftPanel directly passed through
  regionSelection: any; // Consider more specific types if possible
  tripDetails: any;
  categorySelection: any;
  keywordsAndInputs: any;
  placesManagement: any;
  uiVisibility: any;
  handleGenerateSchedule: () => Promise<boolean>;
}

const LeftPanelContent: React.FC<LeftPanelContentProps> = ({
  currentPanel, // Added
  onDateSelect,
  onOpenRegionPanel,
  hasSelectedDates,
  onCategoryClick,
  regionConfirmed,
  categoryStepIndex,
  activeMiddlePanelCategory,
  confirmedCategories,
  selectedKeywordsByCategory,
  toggleKeyword,
  directInputValues,
  onDirectInputChange,
  onConfirmCategory,
  handlePanelBack,
  isCategoryButtonEnabled,
  // Destructure other passed props
  regionSelection,
  tripDetails,
  categorySelection: propCategorySelection, // renamed to avoid conflict
  keywordsAndInputs: propKeywordsAndInputs,
  placesManagement: propPlacesManagement,
  uiVisibility: propUiVisibility,
  handleGenerateSchedule: propHandleGenerateSchedule,

}) => {
  // Use englishCategoryNameToKorean for display if CategoryNavigation expects Korean text
  // Assuming CategoryNavigation.categoryOrder expects Korean display names for buttons
  const categoryOrderForNav = propCategorySelection.categoryOrder.map(englishCategoryNameToKorean);


  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
      <PanelHeader
        // Pass necessary props from tripDetails and regionSelection
        selectedRegionDisplayName={regionSelection.getRegionDisplayName()}
        onSelectRegion={regionSelection.handleSelectRegion}
        selectedDates={tripDetails.dates}
        onDateChange={tripDetails.handleDateChange}
        onTimeChange={tripDetails.handleTimeChange}
        // Assuming PanelHeader has been updated for these props or uses them internally via context/hooks
        onDateSelect={onDateSelect} // Kept for now, check PanelHeader props
        onOpenRegionPanel={onOpenRegionPanel} // Kept for now
        hasSelectedDates={hasSelectedDates} // Kept for now
      />

      <CategoryNavigation
        categoryOrder={categoryOrderForNav} // Pass Korean display names
        currentCategoryIndex={categoryStepIndex}
        onCategoryClick={(koreanCategoryName) => {
            // CategoryNavigation gives Korean name, convert to English for internal logic
            const englishCategoryName = propCategorySelection.categoryOrder.find(
                (cat: CategoryName) => englishCategoryNameToKorean(cat) === koreanCategoryName
            );
            if (englishCategoryName) {
                onCategoryClick(englishCategoryName);
            }
        }}
        categorySelectionConfirmed={propCategorySelection.categorySelectionConfirmed}
        confirmedCategories={confirmedCategories.map(englishCategoryNameToKorean)} // Map to Korean for display status
        isCategoryButtonEnabled={(koreanCategoryName) => {
            const englishCategoryName = propCategorySelection.categoryOrder.find(
                (cat: CategoryName) => englishCategoryNameToKorean(cat) === koreanCategoryName
            );
            return englishCategoryName ? isCategoryButtonEnabled(englishCategoryName) : false;
        }}
        activeMiddlePanelCategory={activeMiddlePanelCategory ? englishCategoryNameToKorean(activeMiddlePanelCategory) : null}
      />

      <CategoryPanels
        activeMiddlePanelCategory={activeMiddlePanelCategory} // Pass English CategoryName
        selectedKeywordsByCategory={selectedKeywordsByCategory}
        toggleKeyword={toggleKeyword}
        directInputValues={directInputValues} // Already Record<CategoryName, string>
        onDirectInputChange={onDirectInputChange} // Already Record<CategoryName, (value: string) => void>
        onConfirmCategory={onConfirmCategory} // Already Record<CategoryName, (finalKeywords: string[]) => void>
        handlePanelBack={handlePanelBack} // Already Record<CategoryName, () => void>
      />
    </div>
  );
};

export default LeftPanelContent;
