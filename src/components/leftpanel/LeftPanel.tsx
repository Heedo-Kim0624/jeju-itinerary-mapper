
import React from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import RegionSelector from './RegionSelector';
import DatePicker from './DatePicker';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
import ScheduleLoadingIndicator from './ScheduleLoadingIndicator';
import ItineraryView from './ItineraryView';
import PanelHeader from './PanelHeader';
import LeftPanelContainer from './LeftPanelContainer'; // Assuming this is the new container
import LeftPanelContent from './LeftPanelContent'; // Manages content switching

import { useLeftPanel } from '@/hooks/use-left-panel';
import { CategoryName } from '@/utils/categoryUtils';

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
    forceRefreshCounter, // for debug or forcing updates
  } = useLeftPanel();

  // Handler functions for category interactions, ensuring correct CategoryName type
  const handleCategorySelect = (category: CategoryName) => {
    keywordsAndInputs.handleConfirmCategory(category, [], true); // Example usage
  };

  const handleDirectInputChange = (category: CategoryName, value: string) => {
    const handler = keywordsAndInputs.onDirectInputChange[category as keyof typeof keywordsAndInputs.onDirectInputChange];
    if (handler) {
      handler(value);
    }
  };
  
  const handleConfirmCategoryKeywords = (category: CategoryName, keywords: string[]) => {
     keywordsAndInputs.handleConfirmCategory(category, keywords, false);
  };

  const handleClearSelection = (category: CategoryName) => {
    const clearHandler = categorySelection.handleClearSelectionByCategory[category as keyof typeof categorySelection.handleClearSelectionByCategory];
    if (clearHandler) {
      clearHandler();
    }
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
        startDate={startDate || new Date()} // Fallback for startDate
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
  
  // Fix the object literals to use English keys instead of Korean keys
  const directInputValuesForPanels = {
    accomodation: keywordsAndInputs.directInputValues.accomodation,
    landmark: keywordsAndInputs.directInputValues.touristSpot, // Assuming touristSpot maps to landmark contextually here
    restaurant: keywordsAndInputs.directInputValues.restaurant,
    cafe: keywordsAndInputs.directInputValues.cafe,
  };

  const onDirectInputChangeHandlers = {
    accomodation: (value: string) => handleDirectInputChange('accommodation', value),
    landmark: (value: string) => handleDirectInputChange('touristSpot', value),
    restaurant: (value: string) => handleDirectInputChange('restaurant', value),
    cafe: (value: string) => handleDirectInputChange('cafe', value),
  };
  
  const confirmCategoryHandlers = {
    accomodation: (finalKeywords: string[]) => handleConfirmCategoryKeywords('accommodation', finalKeywords),
    landmark: (finalKeywords: string[]) => handleConfirmCategoryKeywords('touristSpot', finalKeywords),
    restaurant: (finalKeywords: string[]) => handleConfirmCategoryKeywords('restaurant', finalKeywords),
    cafe: (finalKeywords: string[]) => handleConfirmCategoryKeywords('cafe', finalKeywords),
  };

  const clearSelectionHandlers = {
    accomodation: () => handleClearSelection('accommodation'),
    landmark: () => handleClearSelection('touristSpot'),
    restaurant: () => handleClearSelection('restaurant'),
    cafe: () => handleClearSelection('cafe'),
  };
  
  return (
    <LeftPanelContent
      currentPanel={currentPanel}
      regionSelection={regionSelection}
      tripDetails={tripDetails}
      categorySelection={categorySelection}
      keywordsAndInputs={keywordsAndInputs} // Pass the original hooked version
      placesManagement={placesManagement}
      uiVisibility={uiVisibility}
      handleGenerateSchedule={handleGenerateSchedule}
      directInputValuesForPanels={directInputValuesForPanels}
      onDirectInputChangeHandlers={onDirectInputChangeHandlers}
      confirmCategoryHandlers={confirmCategoryHandlers}
      clearSelectionHandlers={clearSelectionHandlers}
    />
  );
};

export default LeftPanel;
