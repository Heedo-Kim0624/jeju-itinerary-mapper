import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { CategoryName } from '@/utils/categoryUtils';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';
import ItineraryView from './ItineraryView';

const LeftPanel: React.FC = () => {
  const {
    activePanel,
    isRegionPanelActive,
    isDatePanelActive,
    isCategoryPanelActive,
    isItineraryPanelActive,
    itineraryCreated,
    itineraryPanelDisplayed,
    selectedDay,
    setActivePanel,
    openRegionPanel,
    openDatePanel,
    openCategoryPanel,
    openItineraryPanel,
    setItineraryCreated,
    setItineraryPanelDisplayed,
    setSelectedDay,
    getDayPlaces,
    findDayByPlaceId,
    setPanelCategoryWithCategoryName
  } = useLeftPanel();

  // 일정 생성 후 UI 상태 변화를 디버깅
  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: itineraryCreated,
      일정패널표시: itineraryPanelDisplayed,
      선택된일자: selectedDay
    });
  }, [
    itineraryCreated, 
    itineraryPanelDisplayed, 
    selectedDay
  ]);

  // 각 카테고리별로 패널 뒤로가기 함수
  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    setActivePanel('region'); // Go back to region panel
  };

  // 결과 닫기 핸들러
  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    // null 사용
    setItineraryPanelDisplayed(false);
  };

  // 카테고리 확인 핸들러 - CategoryName 타입 사용
  const handleConfirmByCategory = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    // 키워드 확인 후 카테고리 결과 화면 표시
    // Placeholder implementation
    return true;
  };

  // Fix the type error by ensuring categoryName is of type CategoryName
  const handleCategorySelect = (categoryName: CategoryName) => {
    setPanelCategoryWithCategoryName(categoryName);
  };

  // Placeholder functions for compatibility with existing code
  const regionSelection = {
    regionSlidePanelOpen: false,
    setRegionSlidePanelOpen: (open: boolean) => {},
    selectedRegions: [],
    handleRegionToggle: (region: string) => {},
    setRegionConfirmed: (confirmed: boolean) => {},
    regionConfirmed: false
  };
  
  const categorySelection = {
    handleCategoryButtonClick: (category: string) => {},
    stepIndex: 0,
    activeMiddlePanelCategory: null,
    confirmedCategories: [],
    selectedKeywordsByCategory: {},
    toggleKeyword: (category: string, keyword: string) => {},
    isCategoryButtonEnabled: () => true
  };
  
  const keywordsAndInputs = {
    directInputValues: {
      accommodation: '',
      landmark: '',
      restaurant: '',
      cafe: ''
    },
    onDirectInputChange: (category: string, value: string) => {},
    handleConfirmCategory: (category: CategoryName, keywords: string[], showResult: boolean) => {}
  };
  
  const placesManagement = {
    selectedPlaces: [],
    handleRemovePlace: (id: string) => {},
    handleViewOnMap: (place: any) => {},
    handleSelectPlace: (place: any) => {},
    allCategoriesSelected: false
  };
  
  const tripDetails = {
    dates: null,
    setDates: (dates: any) => {}
  };
  
  const uiVisibility = {
    showItinerary: itineraryPanelDisplayed,
    setShowItinerary: setItineraryPanelDisplayed,
    showCategoryResult: null,
    setShowCategoryResult: (category: string | null) => {}
  };
  
  const itineraryManagement = {
    itinerary: null,
    selectedItineraryDay: selectedDay,
    handleSelectItineraryDay: setSelectedDay
  };
  
  const handleCreateItinerary = async () => {
    return true;
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
          dates={{
            startDate: tripDetails.dates?.startDate || null,
            endDate: tripDetails.dates?.endDate || null,
            startTime: tripDetails.dates?.startTime || "09:00",
            endTime: tripDetails.dates?.endTime || "21:00"
          }}
          onCreateItinerary={() => {
            // For type compatibility, convert the Promise to a boolean
            handleCreateItinerary().then(result => !!result);
            return true;
          }}
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
              accomodation: (finalKeywords: string[]) => handleConfirmByCategory('숙소', finalKeywords),
              landmark: (finalKeywords: string[]) => handleConfirmByCategory('관광지', finalKeywords),
              restaurant: (finalKeywords: string[]) => handleConfirmByCategory('음식점', finalKeywords),
              cafe: (finalKeywords: string[]) => handleConfirmByCategory('카페', finalKeywords)
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
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
      />
    </div>
  );
};

export default LeftPanel;
