import React from 'react';
import { useLeftPanelOrchestrator } from '@/hooks/left-panel/useLeftPanelOrchestrator';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';
import ItineraryView from './ItineraryView';
// CategoryName is used by orchestrator, Place and ItineraryDay too.

const LeftPanel: React.FC = () => {
  const {
    // activePanel, // No longer directly needed here
    dates,
    setDates,
    // itineraryCreated, // Managed by orchestrator effects or not directly needed
    // itineraryPanelDisplayed, // from uiVisibility
    // selectedDay, // from itineraryManagement
    // setActivePanel, // Used by orchestrator
    // openRegionPanel, // Used by orchestrator
    // openItineraryPanel, // Used by orchestrator
    // setItineraryCreated, // Used by orchestrator
    // setItineraryPanelDisplayed, // from uiVisibility
    // setSelectedDay, // from itineraryManagement
    // setPanelCategoryWithCategoryName, // Used by orchestrator
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    uiVisibility,
    itineraryManagement,
    handleActualCreateItinerary,
    handlePanelBackByCategory,
    handleResultClose,
  } = useLeftPanelOrchestrator();

  // itinerary 타입 변환 (Itinerary -> ItineraryDay[])
  // This is now handled inside useLeftPanelOrchestrator for itineraryManagement.itinerary

  return (
    <div className="relative h-full">
      {uiVisibility.showItinerary && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary}
            startDate={dates?.startDate || new Date()}
            onSelectDay={itineraryManagement.handleSelectItineraryDay}
            selectedDay={itineraryManagement.selectedItineraryDay}
          />
        </div>
      ) : (
        <LeftPanelContainer
          showItinerary={uiVisibility.showItinerary}
          onSetShowItinerary={uiVisibility.setShowItinerary}
          selectedPlaces={placesManagement.selectedPlaces}
          onRemovePlace={placesManagement.handleRemovePlace}
          onViewOnMap={placesManagement.handleViewOnMap}
          allCategoriesSelected={placesManagement.allCategoriesSelected}
          dates={{
            startDate: dates?.startDate || null,
            endDate: dates?.endDate || null,
            startTime: dates?.startTime || "09:00",
            endTime: dates?.endTime || "21:00"
          }}
          onCreateItinerary={handleActualCreateItinerary} // This is now Promise<boolean>
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
        >
          <LeftPanelContent
            onDateSelect={setDates}
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!(dates?.startDate && dates?.endDate)}
            onCategoryClick={categorySelection.handleCategoryButtonClick}
            regionConfirmed={regionSelection.regionConfirmed}
            categoryStepIndex={categorySelection.stepIndex}
            activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory}
            confirmedCategories={categorySelection.confirmedCategories}
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            toggleKeyword={categorySelection.toggleKeyword}
            directInputValues={{
              accomodation: keywordsAndInputs.directInputValues['accommodation'] || '',
              landmark: keywordsAndInputs.directInputValues['landmark'] || '',
              restaurant: keywordsAndInputs.directInputValues['restaurant'] || '',
              cafe: keywordsAndInputs.directInputValues['cafe'] || ''
            }}
            onDirectInputChange={{
              accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('accommodation', value),
              landmark: (value: string) => keywordsAndInputs.onDirectInputChange('landmark', value),
              restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('restaurant', value),
              cafe: (value: string) => keywordsAndInputs.onDirectInputChange('cafe', value)
            }}
            onConfirmCategory={{
              accomodation: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('숙소', finalKeywords),
              landmark: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('관광지', finalKeywords),
              restaurant: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('음식점', finalKeywords),
              cafe: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('카페', finalKeywords)
            }}
            handlePanelBack={{
              accomodation: () => handlePanelBackByCategory('accommodation'),
              landmark: () => handlePanelBackByCategory('landmark'),
              restaurant: () => handlePanelBackByCategory('restaurant'),
              cafe: () => handlePanelBackByCategory('cafe')
            }}
            isCategoryButtonEnabled={categorySelection.isCategoryButtonEnabled}
          />
        </LeftPanelContainer>
      )}

      <RegionPanelHandler
        open={regionSelection.regionSlidePanelOpen}
        onClose={() => regionSelection.setRegionSlidePanelOpen(false)}
        selectedRegions={regionSelection.selectedRegions}
        onToggle={regionSelection.handleRegionToggle}
        onConfirm={() => {
          regionSelection.setRegionSlidePanelOpen(false);
          if (regionSelection.selectedRegions.length > 0) regionSelection.setRegionConfirmed(true);
          else alert('지역을 선택해주세요.');
        }}
      />

      <CategoryResultHandler
        showCategoryResult={uiVisibility.showCategoryResult} // Use from orchestrator
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose} // Use from orchestrator
        onSelectPlace={placesManagement.handleSelectPlace} // Use from orchestrator
        selectedPlaces={placesManagement.selectedPlaces} // Use from orchestrator
      />
    </div>
  );
};

export default LeftPanel;
