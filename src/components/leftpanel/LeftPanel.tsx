
import React from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';

const LeftPanel: React.FC = () => {
  const {
    // Region and selections
    selectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle,
    
    // Category panel
    categoryStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    handleCategoryButtonClick,
    
    // Keywords and inputs
    selectedKeywordsByCategory,
    toggleKeyword,
    directInputValues,
    onDirectInputChange,
    handleConfirmByCategory,
    handlePanelBackByCategory,
    
    // Places
    selectedPlaces,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    
    // Dates and trips
    dates,
    setDates,
    
    // UI visibility
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    handleResultClose,
    
    // Itinerary
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    handleCreateItinerary,
    
    // Place selection
    handleSelectPlace,
  } = useLeftPanel();

  return (
    <div className="relative h-full">
      <LeftPanelContainer
        showItinerary={showItinerary}
        onSetShowItinerary={setShowItinerary}
        selectedPlaces={selectedPlaces}
        onRemovePlace={handleRemovePlace}
        onViewOnMap={handleViewOnMap}
        allCategoriesSelected={allCategoriesSelected}
        dates={dates}
        onCreateItinerary={handleCreateItinerary}
        itinerary={itinerary}
        selectedItineraryDay={selectedItineraryDay}
        onSelectDay={handleSelectItineraryDay}
      >
        <LeftPanelContent
          onDateSelect={setDates}
          onOpenRegionPanel={() => setRegionSlidePanelOpen(true)}
          hasSelectedDates={!!dates}
          onCategoryClick={handleCategoryButtonClick}
          regionConfirmed={regionConfirmed}
          categoryStepIndex={categoryStepIndex}
          activeMiddlePanelCategory={activeMiddlePanelCategory}
          confirmedCategories={confirmedCategories}
          selectedKeywordsByCategory={selectedKeywordsByCategory}
          toggleKeyword={toggleKeyword}
          directInputValues={directInputValues}
          onDirectInputChange={onDirectInputChange}
          onConfirmCategory={handleConfirmByCategory}
          handlePanelBack={handlePanelBackByCategory}
          isCategoryButtonEnabled={() => true}
        />
      </LeftPanelContainer>

      <RegionPanelHandler
        open={regionSlidePanelOpen}
        onClose={() => setRegionSlidePanelOpen(false)}
        selectedRegions={selectedRegions}
        onToggle={handleRegionToggle}
        onConfirm={() => {
          setRegionSlidePanelOpen(false);
          if (selectedRegions.length > 0) setRegionConfirmed(true);
          else alert('지역을 선택해주세요.');
        }}
      />

      <CategoryResultHandler
        showCategoryResult={showCategoryResult}
        selectedRegions={selectedRegions}
        selectedKeywordsByCategory={selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={handleSelectPlace}
        selectedPlaces={selectedPlaces}
      />
    </div>
  );
};

export default LeftPanel;
