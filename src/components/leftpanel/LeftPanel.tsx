
import React from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';

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

  return (
    <div className="relative h-full">
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
          categoryStepIndex={categorySelection.categoryStepIndex}
          activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory}
          confirmedCategories={categorySelection.confirmedCategories}
          selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
          toggleKeyword={categorySelection.toggleKeyword}
          directInputValues={keywordsAndInputs.directInputValues}
          onDirectInputChange={keywordsAndInputs.onDirectInputChange}
          onConfirmCategory={keywordsAndInputs.handleConfirmByCategory}
          handlePanelBack={categorySelection.handlePanelBackByCategory}
          isCategoryButtonEnabled={() => true}
        />
      </LeftPanelContainer>

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
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={uiVisibility.handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
      />
    </div>
  );
};

export default LeftPanel;
