import React, { useState, useEffect } from 'react';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { useRegionSelection } from '@/hooks/use-region-selection';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useMapContext } from '../rightpanel/MapContext';
import { usePanelVisibility } from '@/hooks/use-panel-visibility';
import LeftPanelContent from './LeftPanelContent';
import RegionSlidePanel from '../middlepanel/RegionSlidePanel';
import CategoryResultHandler from './CategoryResultHandler';
import PlaceCart from './PlaceCart';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';

const LeftPanel: React.FC = () => {
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [selectedPlacesByCategory, setSelectedPlacesByCategory] = useState<{
    '숙소': Place[],
    '관광지': Place[],
    '음식점': Place[],
    '카페': Place[],
  }>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
  });
  
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

  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  
  const {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult,
  } = usePanelVisibility();

  const allCategoriesSelected = 
    selectedPlacesByCategory['숙소'].length > 0 && 
    selectedPlacesByCategory['관광지'].length > 0 && 
    selectedPlacesByCategory['음식점'].length > 0 && 
    selectedPlacesByCategory['카페'].length > 0;

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

  const handleSelectPlace = (place: Place, checked: boolean) => {
    if (checked) {
      setSelectedPlaces(prevPlaces => {
        if (prevPlaces.some(p => p.id === place.id)) {
          return prevPlaces;
        }
        return [...prevPlaces, place];
      });
      
      if (showCategoryResult) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [showCategoryResult]: [...prev[showCategoryResult as keyof typeof prev], place]
        }));
      }
    } else {
      setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== place.id));
      
      if (showCategoryResult) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [showCategoryResult]: prev[showCategoryResult as keyof typeof prev].filter(p => p.id !== place.id)
        }));
      }
    }
  };

  const handleRemovePlace = (placeId: string) => {
    const placeToRemove = selectedPlaces.find(p => p.id === placeId);
    
    setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== placeId));
    
    if (placeToRemove) {
      Object.keys(selectedPlacesByCategory).forEach(category => {
        const categoryKey = category as keyof typeof selectedPlacesByCategory;
        if (selectedPlacesByCategory[categoryKey].some(p => p.id === placeId)) {
          setSelectedPlacesByCategory(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].filter(p => p.id !== placeId)
          }));
        }
      });
    }
  };
  
  const handleViewOnMap = (place: Place) => {
    clearMarkersAndUiElements();
    addMarkers([place], { highlight: true });
    panTo({ lat: place.y, lng: place.x });
  };

  const handleCreateItinerary = () => {
    toast.success("경로 생성 기능이 구현될 예정입니다.");
    setShowItinerary(true);
  };

  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('숙소', finalKeywords, clearSelection);
      setShowCategoryResult('숙소');
      if (selectedRegions.length > 0) {
        panTo(selectedRegions[0]);
      }
    },
    landmark: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('관광지', finalKeywords, clearSelection);
      setShowCategoryResult('관광지');
      if (selectedRegions.length > 0) {
        panTo(selectedRegions[0]);
      }
    },
    restaurant: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('음식점', finalKeywords, clearSelection);
      setShowCategoryResult('음식점');
      if (selectedRegions.length > 0) {
        panTo(selectedRegions[0]);
      }
    },
    cafe: (finalKeywords: string[], clearSelection: boolean = false) => {
      handleConfirmCategory('카페', finalKeywords, clearSelection);
      setShowCategoryResult('카페');
      if (selectedRegions.length > 0) {
        panTo(selectedRegions[0]);
      }
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
          
          <div className="px-4 mb-4">
            <PlaceCart 
              selectedPlaces={selectedPlaces} 
              onRemovePlace={handleRemovePlace}
              onViewOnMap={handleViewOnMap}
            />

            {allCategoriesSelected && (
              <div className="mt-4">
                <button
                  onClick={handleCreateItinerary}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <span className="mr-1">경로 생성</span>
                </button>
              </div>
            )}
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
