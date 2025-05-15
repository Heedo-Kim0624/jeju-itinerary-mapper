import React, { useState, useEffect, useCallback } from 'react';
import { Place } from '@/types/supabase';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useCategoryResults } from '@/hooks/use-category-results';
import { useItinerary } from '@/hooks/use-itinerary';
import { useRegionSelection } from '@/hooks/use-region-selection';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { useCategoryHandlers } from '@/hooks/left-panel/use-category-handlers';
import { useItineraryHandlers } from '@/hooks/left-panel/use-itinerary-handlers';
import { useInputState } from '@/hooks/left-panel/use-input-state';
import RegionPanelHandler from './RegionPanelHandler';
import CategorySelector from './CategorySelector';
import CategoryResultsPanel from './CategoryResultsPanel';
import ScheduleGenerator from './ScheduleGenerator';
import ScheduleViewer from './ScheduleViewer';
import ItineraryButton from './ItineraryButton';
import { RegionDetails } from '@/types/region';

interface LeftPanelProps {
  onClose: () => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  onClose
}) => {
  // 지역 및 카테고리 선택 기능
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();
  
  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryResultScreen, setShowCategoryResultScreen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<RegionDetails[]>([]);
  
  // 입력값 관리
  const { directInputValues, onDirectInputChange } = useInputState();

  // 키워드 및 입력 관련 기능
  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category as any, finalKeywords, clearSelection);
      if (clearSelection) {
        setShowCategoryResult(category);
      }
    }
  };

  // 장소 관리 기능
  const {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    isAccommodationLimitReached,
  } = useSelectedPlaces();

  const placesManagement = {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    isAccommodationLimitReached,
    prepareSchedulePayload
  };

  // 일정 관리 기능
  const { 
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const itineraryManagement = {
    itinerary,
    selectedItineraryDay,
    setSelectedItineraryDay,
    handleSelectItineraryDay
  };

  // UI 가시성 관리
  const uiVisibility = {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult
  };

  // 카테고리 결과 관리
  const { 
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch
  } = useCategoryResults(showCategoryResult as any, 
    showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
    regionSelection.selectedRegions);

  const categoryResults = {
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || []
  };

  // 카테고리 핸들러
  const categoryHandlers = useCategoryHandlers();
  const handleCategorySelect = (category: string) => categoryHandlers.handleCategorySelect(category, refetch);
  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(setShowCategoryResult);
  const handleConfirmCategory = () => categoryHandlers.handleConfirmCategory(selectedCategory);

  // 일정 핸들러
  const itineraryHandlers = useItineraryHandlers();
  const handleCreateItinerary = async () => {
    return itineraryHandlers.handleCreateItinerary(
      tripDetails,
      selectedPlaces,
      prepareSchedulePayload,
      recommendedPlaces,
      generateItinerary,
      setShowItinerary,
      setCurrentPanel
    );
  };
  
  const handleCloseItinerary = () => {
    itineraryHandlers.handleCloseItinerary(setShowItinerary, setCurrentPanel);
  };

  // 일정이 생성되면 첫 번째 날짜 선택
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && showItinerary) {
      setSelectedItineraryDay(itinerary[0]?.day || 1);
    }
  }, [itinerary, showItinerary, setSelectedItineraryDay]);

  // 지역 선택 핸들러 수정
  const handleRegionsSelected = (selectedRegions: RegionDetails[]) => {
    setSelectedRegions(selectedRegions);
    regionSelection.onRegionsChange(selectedRegions);
  };

  // 지역 패널 핸들러
  const regionPanelHandlers = {
    selectedRegions,
    onRegionsSelected: handleRegionsSelected,
    onClose: () => setCurrentPanel('date')
  };

  // 카테고리 패널 핸들러
  const categoryPanelHandlers = {
    onCategorySelect: handleCategorySelect,
    onClose: () => setCurrentPanel('region'),
    onConfirmCategory: handleConfirmCategory,
    selectedCategory,
    setSelectedCategory
  };

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-50 shadow-md">
      {/* 패널 내용 */}
      {currentPanel === 'region' && (
        <RegionPanelHandler
          onClose={() => setCurrentPanel('date')}
          onRegionsSelected={handleRegionsSelected}
          selectedRegions={selectedRegions}
        />
      )}

      {currentPanel === 'date' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">여행 날짜 선택</h2>
          <p>선택된 지역: {selectedRegions.map(r => r.name).join(', ') || '없음'}</p>
          <button onClick={() => setCurrentPanel('category')}>다음: 카테고리 선택</button>
        </div>
      )}

      {currentPanel === 'category' && (
        <CategorySelector
          selectedRegions={selectedRegions}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          onClose={() => setCurrentPanel('region')}
          onConfirmCategory={handleConfirmCategory}
          directInputValues={directInputValues}
          onDirectInputChange={onDirectInputChange}
          selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
          toggleKeyword={categorySelection.toggleKeyword}
          setKeywords={categorySelection.setKeywords}
          clearKeywords={categorySelection.clearKeywords}
        />
      )}

      {showCategoryResult && (
        <CategoryResultsPanel
          category={showCategoryResult}
          regions={regionSelection.selectedRegions.map(region => region.name)}
          keywords={categorySelection.selectedKeywordsByCategory[showCategoryResult] || []}
          onClose={handleCloseCategoryResult}
          isLoading={isCategoryLoading}
          recommendedPlaces={categoryResults.recommendedPlaces}
          normalPlaces={categoryResults.normalPlaces}
          selectedPlaces={placesManagement.selectedPlaces}
          onSelectPlace={handleSelectPlace}
          isPlaceSelected={(id: string) => placesManagement.selectedPlaces.some(place => place.id === id)}
        />
      )}

      {currentPanel === 'itinerary' && showItinerary && (
        <ScheduleGenerator
          selectedPlaces={selectedPlaces}
          dates={tripDetails.dates}
          onClose={handleCloseItinerary}
        />
      )}

      {showItinerary && (
        <ScheduleViewer
          schedule={itinerary}
          selectedDay={selectedItineraryDay}
          onDaySelect={handleSelectItineraryDay}
          onClose={handleCloseItinerary}
          startDate={tripDetails.dates?.startDate || new Date()}
        />
      )}

      {!showItinerary && currentPanel !== 'itinerary' && (
        <ItineraryButton
          allCategoriesSelected={allCategoriesSelected}
          onCreateItinerary={handleCreateItinerary}
        />
      )}
    </div>
  );
};

export default LeftPanel;
