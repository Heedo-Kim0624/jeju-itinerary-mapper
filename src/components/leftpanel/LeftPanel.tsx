import React from 'react';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { useRegionSelection } from '@/hooks/use-region-selection';
import { useTripDetails } from '@/hooks/use-trip-details';
import { usePanelVisibility } from '@/hooks/use-panel-visibility';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useMapContext } from '@/components/rightpanel/MapContext';
import LeftPanelContent from './LeftPanelContent';
import RegionSlidePanel from '../middlepanel/RegionSlidePanel';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';

const LeftPanel: React.FC = () => {
  const {
    selectedPlaces,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected
  } = useSelectedPlaces();
  
  const {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex: categoryStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    handleCategoryClick,
    handleCategoryButtonClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
    isCategoryButtonEnabled
  } = useCategorySelection();

  const {
    selectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle
  } = useRegionSelection();

  const {
    dates,
    setDates,
    accomodationDirectInput,
    setAccomodationDirectInput,
    landmarkDirectInput,
    setLandmarkDirectInput,
    restaurantDirectInput,
    setRestaurantDirectInput,
    cafeDirectInput,
    setCafeDirectInput,
  } = useTripDetails();

  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult,
  } = usePanelVisibility();

  const { panTo } = useMapContext();

  const directInputValues = {
    accomodation: accomodationDirectInput,
    landmark: landmarkDirectInput,
    restaurant: restaurantDirectInput,
    cafe: cafeDirectInput
  };

  const onDirectInputChange = {
    accomodation: setAccomodationDirectInput,
    landmark: setLandmarkDirectInput,
    restaurant: setRestaurantDirectInput,
    cafe: setCafeDirectInput
  };

  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('숙소', finalKeywords, clearSelection);
      setShowCategoryResult('숙소');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('관광지', finalKeywords, clearSelection);
      setShowCategoryResult('관광지');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('음식점', finalKeywords, clearSelection);
      setShowCategoryResult('음식점');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('카페', finalKeywords, clearSelection);
      setShowCategoryResult('카페');
      if (selectedRegions.length > 0) panTo(selectedRegions[0]);
    }
  };

  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack(),
    landmark: () => handlePanelBack(),
    restaurant: () => handlePanelBack(),
    cafe: () => handlePanelBack()
  };

  const handleResultClose = () => {
    setShowCategoryResult(null);
  };

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
      >
        <LeftPanelContent
          onDateSelect={setDates}
          onOpenRegionPanel={() => setRegionSlidePanelOpen(true)}
          hasSelectedDates={!!dates}
          categoryOrder={categoryOrder}
          onCategoryClick={categorySelectionConfirmed ? handleCategoryButtonClick : handleCategoryClick}
          onBackToRegionSelect={() => setRegionConfirmed(false)}
          onConfirmCategoryOrder={() => setCategorySelectionConfirmed(true)}
          regionConfirmed={regionConfirmed}
          categoryStepIndex={categoryStepIndex}
          categorySelectionConfirmed={categorySelectionConfirmed}
          activeMiddlePanelCategory={activeMiddlePanelCategory}
          confirmedCategories={confirmedCategories}
          selectedKeywordsByCategory={selectedKeywordsByCategory}
          toggleKeyword={toggleKeyword}
          directInputValues={directInputValues}
          onDirectInputChange={onDirectInputChange}
          onConfirmCategory={handleConfirmByCategory}
          handlePanelBack={handlePanelBackByCategory}
          isCategoryButtonEnabled={isCategoryButtonEnabled}
        />
      </LeftPanelContainer>

      <RegionSlidePanel
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
