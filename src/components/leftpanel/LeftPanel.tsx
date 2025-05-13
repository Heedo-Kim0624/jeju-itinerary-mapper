
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';
import ItineraryView from './ItineraryView';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement
  } = useLeftPanel();

  // 일정 생성 후 UI 상태 변화를 디버깅
  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: !!itineraryManagement.itinerary,
      일정패널표시: uiVisibility.showItinerary,
      선택된일자: itineraryManagement.selectedItineraryDay
    });
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay
  ]);

  // Transform direct input values for CategoryPanels
  const directInputValuesForPanel = {
    accomodation: keywordsAndInputs.directInputValues['숙소'] || '',
    landmark: keywordsAndInputs.directInputValues['관광지'] || '',
    restaurant: keywordsAndInputs.directInputValues['음식점'] || '',
    cafe: keywordsAndInputs.directInputValues['카페'] || '',
  };

  // Transform direct input change handlers for CategoryPanels
  const onDirectInputChangeForPanel = {
    accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('숙소', value),
    landmark: (value: string) => keywordsAndInputs.onDirectInputChange('관광지', value),
    restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('음식점', value),
    cafe: (value: string) => keywordsAndInputs.onDirectInputChange('카페', value),
  };

  // Transform confirm handlers for CategoryPanels
  const onConfirmCategoryForPanel = {
    accomodation: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmByCategory('숙소'),
    landmark: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmByCategory('관광지'),
    restaurant: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmByCategory('음식점'),
    cafe: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmByCategory('카페'),
  };

  // Transform panel back handlers for CategoryPanels
  const handlePanelBackForCategory = {
    accomodation: () => keywordsAndInputs.handlePanelBackByCategory('숙소'),
    landmark: () => keywordsAndInputs.handlePanelBackByCategory('관광지'),
    restaurant: () => keywordsAndInputs.handlePanelBackByCategory('음식점'),
    cafe: () => keywordsAndInputs.handlePanelBackByCategory('카페'),
  };

  return (
    <div className="relative h-full">
      {uiVisibility.showItinerary && itineraryManagement.itinerary ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary}
            startDate={tripDetails.dates?.startDate || new Date()}
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
          dates={tripDetails.dates}
          onCreateItinerary={itineraryManagement.handleCreateItinerary}
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
        >
          <LeftPanelContent
            onDateSelect={tripDetails.setDates}
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!tripDetails.dates}
            onCategoryClick={categorySelection.handleCategoryButtonClick}
            regionConfirmed={regionSelection.regionConfirmed}
            activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory}
            confirmedCategories={categorySelection.confirmedCategories}
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            toggleKeyword={categorySelection.toggleKeyword}
            directInputValues={directInputValuesForPanel}
            onDirectInputChange={onDirectInputChangeForPanel}
            onConfirmCategory={onConfirmCategoryForPanel}
            handlePanelBack={handlePanelBackForCategory}
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
        showCategoryResult={!!uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={() => uiVisibility.setShowCategoryResult(null)}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onPlacesLoaded={itineraryManagement.updateAvailablePlaces}
      />
    </div>
  );
};

export default LeftPanel;
