
import React, { useState, useMemo } from 'react';
import PanelHeader from './PanelHeader';
import CategoryOrderingStep from './CategoryOrderingStep';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import GenerateButton from './GenerateButton';
import RegionSlidePanel from '../middlepanel/RegionSlidePanel';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { useRegionSelection } from '@/hooks/use-region-selection';
import { useTripDetails } from '@/hooks/use-trip-details';

interface LeftPanelProps {
  onToggleRegionPanel?: () => void;
}

const LeftPanel: React.FC<LeftPanelProps> = () => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    currentCategoryIndex,
    activeMiddlePanelCategory,
    setActiveMiddlePanelCategory, // Added this line to destructure the setter
    selectedKeywordsByCategory,
    handleCategoryClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory
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
    buildPromptKeywords
  } = useTripDetails();

  const promptKeywords = useMemo(() => buildPromptKeywords(), [dates]);

  const handleGenerateClick = () => {
    console.log('장소 생성 버튼 클릭됨', promptKeywords);
  };

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
    accomodation: (finalKeywords: string[]) => handleConfirmCategory('숙소', finalKeywords),
    landmark: (finalKeywords: string[]) => handleConfirmCategory('관광지', finalKeywords),
    restaurant: (finalKeywords: string[]) => handleConfirmCategory('음식점', finalKeywords),
    cafe: (finalKeywords: string[]) => handleConfirmCategory('카페', finalKeywords)
  };

  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack('숙소'),
    landmark: () => handlePanelBack('관광지'),
    restaurant: () => handlePanelBack('음식점'),
    cafe: () => { handlePanelBack('카페'); }
  };

  return (
    <div className="relative h-full">
      {!showItinerary && (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
            <PanelHeader 
              onDateSelect={setDates}
              onOpenRegionPanel={() => setRegionSlidePanelOpen(!regionSlidePanelOpen)}
              hasSelectedDates={!!dates}
            />

            <CategoryOrderingStep
              categoryOrder={categoryOrder}
              onCategoryClick={handleCategoryClick}
              onBackToRegionSelect={() => { setRegionConfirmed(false); }}
              onConfirmCategoryOrder={() => setCategorySelectionConfirmed(true)}
              regionConfirmed={regionConfirmed}
            />

            <CategoryNavigation
              categoryOrder={categoryOrder}
              currentCategoryIndex={currentCategoryIndex}
              onCategoryClick={(category) => setActiveMiddlePanelCategory(category)}
              categorySelectionConfirmed={categorySelectionConfirmed}
            />

            <CategoryPanels
              activeMiddlePanelCategory={activeMiddlePanelCategory}
              selectedKeywordsByCategory={selectedKeywordsByCategory}
              toggleKeyword={toggleKeyword}
              directInputValues={directInputValues}
              onDirectInputChange={onDirectInputChange}
              onConfirmCategory={handleConfirmByCategory}
              handlePanelBack={handlePanelBackByCategory}
            />

            <GenerateButton
              categorySelectionConfirmed={categorySelectionConfirmed}
              categoryOrder={categoryOrder}
              currentCategoryIndex={currentCategoryIndex}
              promptKeywords={promptKeywords}
              onGenerateClick={handleGenerateClick}
            />
          </div>
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
          if (selectedRegions.length > 0) {
            setRegionConfirmed(true);
          } else {
            alert('지역을 선택해주세요.');
          }
        }}
      />
    </div>
  );
};

export default LeftPanel;
