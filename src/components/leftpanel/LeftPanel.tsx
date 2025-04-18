
import React from 'react';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { useRegionSelection } from '@/hooks/use-region-selection';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useMapContext } from '../rightpanel/MapContext';
import { usePanelVisibility } from '@/hooks/use-panel-visibility';
import LeftPanelContent from './LeftPanelContent';
import RegionSlidePanel from '../middlepanel/RegionSlidePanel';
import CategoryResultHandler from './CategoryResultHandler';

const LeftPanel: React.FC = () => {
  const {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex: categoryStepIndex,
    activeMiddlePanelCategory,
    selectedKeywordsByCategory,
    handleCategoryClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory,
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

  const { panTo } = useMapContext();
  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult,
  } = usePanelVisibility();

  // Direct input values mapping
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
    accomodation: (finalKeywords: string[]) => {
      handleConfirmCategory('숙소', finalKeywords);
      setShowCategoryResult('숙소');
      panTo(selectedRegions[0]);
    },
    landmark: (finalKeywords: string[]) => {
      handleConfirmCategory('관광지', finalKeywords);
      setShowCategoryResult('관광지');
      panTo(selectedRegions[0]);
    },
    restaurant: (finalKeywords: string[]) => {
      handleConfirmCategory('음식점', finalKeywords);
      setShowCategoryResult('음식점');
      panTo(selectedRegions[0]);
    },
    cafe: (finalKeywords: string[]) => {
      handleConfirmCategory('카페', finalKeywords);
      setShowCategoryResult('카페');
      panTo(selectedRegions[0]);
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
    const next = categoryStepIndex + 1;
    if (next < categoryOrder.length) {
      // activeMiddlePanelCategory는 hook 내부에서 관리되므로 직접 설정 불필요
    } else {
      // 모든 카테고리 완료
    }
  };

  return (
    <div className="relative h-full">
      {!showItinerary && (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
          <LeftPanelContent
            onDateSelect={setDates}
            onOpenRegionPanel={() => setRegionSlidePanelOpen(!regionSlidePanelOpen)}
            hasSelectedDates={!!dates}
            categoryOrder={categoryOrder}
            onCategoryClick={handleCategoryClick}
            onBackToRegionSelect={() => setRegionConfirmed(false)}
            onConfirmCategoryOrder={() => setCategorySelectionConfirmed(true)}
            regionConfirmed={regionConfirmed}
            categoryStepIndex={categoryStepIndex}
            categorySelectionConfirmed={categorySelectionConfirmed}
            activeMiddlePanelCategory={activeMiddlePanelCategory}
            selectedKeywordsByCategory={selectedKeywordsByCategory}
            toggleKeyword={toggleKeyword}
            directInputValues={directInputValues}
            onDirectInputChange={onDirectInputChange}
            onConfirmCategory={handleConfirmByCategory}
            handlePanelBack={handlePanelBackByCategory}
          />
        </div>
      )}

      {showItinerary && (
        <div className="absolute inset-0 z-10 bg-white p-4 overflow-y-auto">
          <button
            onClick={() => setShowItinerary(false)}
            className="text-sm text-blue-600 hover:underline mb-4"
          >
            ← 뒤로
          </button>
        </div>
      )}

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
      />
    </div>
  );
};

export default LeftPanel;
