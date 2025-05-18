import React from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import RegionSelector from './RegionSelector';
import DatePicker from './DatePicker';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import ItineraryView from './ItineraryView';
import PanelHeader from './PanelHeader';
import LeftPanelContainer from './LeftPanelContainer'; // Assuming this is the new container
import LeftPanelContent from './LeftPanelContent'; // Manages content switching

import { useLeftPanel } from '@/hooks/use-left-panel';
import { CategoryName, koreanToEnglishCategoryName, englishCategoryNameToKorean } from '@/utils/categoryUtils';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    isGeneratingSchedule,
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    handleGenerateSchedule,
    handleCloseItinerary,
    startDate,
    currentPanel, // from useLeftPanel
    // handleCategorySelect, // from useLeftPanel, used by CategoryNavigation/CategoryPanels
    // handleCloseCategoryResult, // from useLeftPanel
    // handleConfirmCategory, // from useLeftPanel
    isCategoryLoading, // from useLeftPanel
    categoryResults, // from useLeftPanel
    // forceRefreshCounter, // for debug or forcing updates
  } = useLeftPanel();

  // Handler functions for category interactions, ensuring correct CategoryName type (English)
  const handleCategorySelectWrapper = (category: CategoryName) => {
    // This function is passed to LeftPanelContent's onCategoryClick, which expects CategoryName (English)
    // The original handleCategorySelect from useLeftPanel already takes CategoryName (English)
    // So, directly use it or call the one from useLeftPanel if it has more logic.
    // For now, assuming keywordsAndInputs.handleConfirmCategory is the intended action
    // and that it expects an English CategoryName.
    keywordsAndInputs.handleConfirmCategory(category, [], true);
  };

  const handleDirectInputChangeWrapper = (category: CategoryName, value: string) => {
    // keywordsAndInputs.onDirectInputChange already expects CategoryName (English)
    keywordsAndInputs.onDirectInputChange(category, value);
  };
  
  const handleConfirmCategoryKeywordsWrapper = (category: CategoryName, keywords: string[]) => {
    // keywordsAndInputs.handleConfirmCategory expects CategoryName (English)
     keywordsAndInputs.handleConfirmCategory(category, keywords, false);
  };

  const handleClearSelectionWrapper = (category: CategoryName) => {
    // Clears keywords for the category and triggers result panel show
    keywordsAndInputs.handleConfirmCategory(category, [], true);
  };

  if (isGeneratingSchedule) {
    return (
      <ScheduleLoadingIndicator
        text="일정 생성 중..."
        subtext={`${new Date().toLocaleTimeString()} 기준 처리 중`}
      />
    );
  }

  if (uiVisibility.showItinerary && itinerary && itinerary.length > 0) {
    return (
      <ItineraryView
        itinerary={itinerary}
        startDate={startDate || new Date()} 
        onSelectDay={handleSelectItineraryDay}
        selectedDay={selectedItineraryDay}
        onClose={handleCloseItinerary}
        debug={{
          itineraryLength: itinerary.length,
          selectedDay: selectedItineraryDay,
          showItinerary: uiVisibility.showItinerary
        }}
      />
    );
  }
  
  // Prepare props for LeftPanelContent, ensuring keys are English CategoryName
  const directInputValuesForPanels: Record<CategoryName, string> = {
    accommodation: keywordsAndInputs.directInputValues.accommodation,
    attraction: keywordsAndInputs.directInputValues.attraction,
    restaurant: keywordsAndInputs.directInputValues.restaurant,
    cafe: keywordsAndInputs.directInputValues.cafe,
  };

  const onDirectInputChangeHandlers: Record<CategoryName, (value: string) => void> = {
    accommodation: (value: string) => handleDirectInputChangeWrapper('accommodation', value),
    attraction: (value: string) => handleDirectInputChangeWrapper('attraction', value),
    restaurant: (value: string) => handleDirectInputChangeWrapper('restaurant', value),
    cafe: (value: string) => handleDirectInputChangeWrapper('cafe', value),
  };
  
  const confirmCategoryHandlers: Record<CategoryName, (finalKeywords: string[]) => void> = {
    accommodation: (finalKeywords: string[]) => handleConfirmCategoryKeywordsWrapper('accommodation', finalKeywords),
    attraction: (finalKeywords: string[]) => handleConfirmCategoryKeywordsWrapper('attraction', finalKeywords),
    restaurant: (finalKeywords: string[]) => handleConfirmCategoryKeywordsWrapper('restaurant', finalKeywords),
    cafe: (finalKeywords: string[]) => handleConfirmCategoryKeywordsWrapper('cafe', finalKeywords),
  };

  const clearSelectionHandlers: Record<CategoryName, () => void> = {
    accommodation: () => handleClearSelectionWrapper('accommodation'),
    attraction: () => handleClearSelectionWrapper('attraction'),
    restaurant: () => handleClearSelectionWrapper('restaurant'),
    cafe: () => handleClearSelectionWrapper('cafe'),
  };
  
  return (
    <LeftPanelContent
      currentPanel={currentPanel}
      regionSelection={regionSelection}
      tripDetails={tripDetails}
      categorySelection={categorySelection}
      keywordsAndInputs={keywordsAndInputs}
      placesManagement={placesManagement}
      uiVisibility={uiVisibility}
      handleGenerateSchedule={handleGenerateSchedule}
      // Props for LeftPanelContent structure
      onDateSelect={tripDetails.handleDateChange} // Example, adjust as per PanelHeader needs
      onOpenRegionPanel={() => currentPanel === 'region'} // Example, adjust
      hasSelectedDates={!!tripDetails.dates.startDate && !!tripDetails.dates.endDate}
      onCategoryClick={handleCategorySelectWrapper} // This expects English CategoryName
      regionConfirmed={regionSelection.selectedRegions.length > 0} // Example
      categoryStepIndex={categorySelection.stepIndex}
      activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory} // This should be English CategoryName
      confirmedCategories={categorySelection.confirmedCategories} // This should be English CategoryName[]
      selectedKeywordsByCategory={keywordsAndInputs.selectedKeywordsByCategory} // This is Record<CategoryName, string[]>
      toggleKeyword={keywordsAndInputs.toggleKeyword} // toggleKeyword(category: CategoryName, keyword: string)
      directInputValues={directInputValuesForPanels}
      onDirectInputChange={onDirectInputChangeHandlers}
      onConfirmCategory={confirmCategoryHandlers}
      handlePanelBack={categorySelection.handlePanelBackByCategory} // Assuming this is Record<CategoryName, () => void>
      isCategoryButtonEnabled={categorySelection.isCategoryButtonEnabled} // Expects English CategoryName
    />
  );
};

export default LeftPanel;
