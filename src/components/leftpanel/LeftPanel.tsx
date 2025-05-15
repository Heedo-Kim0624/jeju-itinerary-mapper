
import React, { useState, useCallback } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import { getCategoryKorean } from '@/utils/categoryUtils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import LeftPanelContainer from './LeftPanelContainer';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useItinerary } from '@/hooks/use-itinerary';
import CategoryResultHandler from './CategoryResultHandler';
import { usePanelVisibility } from '@/hooks/use-panel-visibility';
import CategoryNavigation from './CategoryNavigation';

// Define the allowed category names
type CategoryName = 'accommodation' | 'landmark' | 'restaurant' | 'cafe' | 'attraction' | '숙소' | '관광지' | '음식점' | '카페';

interface LeftPanelProps {
  onCreateItinerary: () => boolean;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ onCreateItinerary }) => {
  const [isRegionPanelOpen, setIsRegionPanelOpen] = useState(true);
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false);
  const [isAccommodationPanelOpen, setIsAccommodationPanelOpen] = useState(false);
  const [isLandmarkPanelOpen, setIsLandmarkPanelOpen] = useState(false);
  const [isRestaurantPanelOpen, setIsRestaurantPanelOpen] = useState(false);
  const [isCafePanelOpen, setIsCafePanelOpen] = useState(false);
  const [accommodationKeywords, setAccommodationKeywords] = useState<string[]>([]);
  const [landmarkKeywords, setLandmarkKeywords] = useState<string[]>([]);
  const [restaurantKeywords, setRestaurantKeywords] = useState<string[]>([]);
  const [cafeKeywords, setCafeKeywords] = useState<string[]>([]);
  const [accommodationDirectInputValue, setAccommodationDirectInputValue] = useState('');
  const [landmarkDirectInputValue, setLandmarkDirectInputValue] = useState('');
  const [restaurantDirectInputValue, setRestaurantDirectInputValue] = useState('');
  const [cafeDirectInputValue, setCafeDirectInputValue] = useState('');
  
  // Use hooks to get data and functionality
  const { selectedPlaces, handleRemovePlace, handleViewOnMap, allCategoriesSelected } = useSelectedPlaces();
  const { dates } = useTripDetails();
  const { 
    itinerary, 
    selectedItineraryDay, 
    showItinerary, 
    setShowItinerary, 
    handleSelectItineraryDay 
  } = useItinerary();
  const { showCategoryResult, setShowCategoryResult } = usePanelVisibility();
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  
  const openRegionPanel = () => setIsRegionPanelOpen(true);
  const closeRegionPanel = () => setIsRegionPanelOpen(false);
  const openDatePanel = () => setIsDatePanelOpen(true);
  const closeDatePanel = () => setIsDatePanelOpen(false);
  const openAccommodationPanel = () => setIsAccommodationPanelOpen(true);
  const closeAccommodationPanel = () => setIsAccommodationPanelOpen(false);
  const openLandmarkPanel = () => setIsLandmarkPanelOpen(true);
  const closeLandmarkPanel = () => setIsLandmarkPanelOpen(false);
  const openRestaurantPanel = () => setIsRestaurantPanelOpen(true);
  const closeRestaurantPanel = () => setIsRestaurantPanelOpen(false);
  const openCafePanel = () => setIsCafePanelOpen(true);
  const closeCafePanel = () => setIsCafePanelOpen(false);

  // Category result handler props
  const [selectedKeywordsByCategory, setSelectedKeywordsByCategory] = useState<Record<string, string[]>>({
    '숙소': accommodationKeywords,
    '관광지': landmarkKeywords,
    '음식점': restaurantKeywords,
    '카페': cafeKeywords
  });
  
  const handleSelectPlace = (place: any, checked: boolean, category: string | null) => {
    // Implementation would go here
    console.log("Selected place:", place, "checked:", checked, "category:", category);
  };

  const handleCategoryResultClose = () => {
    setShowCategoryResult(null);
  };

  return (
    <>
      <LeftPanelContainer
        showItinerary={showItinerary}
        onSetShowItinerary={setShowItinerary}
        selectedPlaces={selectedPlaces}
        onRemovePlace={handleRemovePlace}
        onViewOnMap={handleViewOnMap}
        allCategoriesSelected={allCategoriesSelected}
        dates={dates}
        onCreateItinerary={onCreateItinerary}
        itinerary={itinerary}
        selectedItineraryDay={selectedItineraryDay}
        onSelectDay={handleSelectItineraryDay}
      >
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">제주도 여행 플래너</h1>
          <CategoryNavigation 
            categoryOrder={["숙소", "관광지", "음식점", "카페"]}
            currentCategoryIndex={0}
            onCategoryClick={() => {}}
            categorySelectionConfirmed={true}
            confirmedCategories={[]}
            isCategoryButtonEnabled={() => true}
            activeMiddlePanelCategory={null}
          />
        </div>
      </LeftPanelContainer>

      {/* 카테고리 결과 패널 */}
      <CategoryResultHandler
        showCategoryResult={showCategoryResult}
        selectedRegions={selectedRegions}
        selectedKeywordsByCategory={selectedKeywordsByCategory}
        onClose={handleCategoryResultClose}
        onSelectPlace={handleSelectPlace}
        selectedPlaces={selectedPlaces}
      />
    </>
  );
};

export default LeftPanel;
