
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { CategoryName } from '@/utils/categoryUtils';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';
import ItineraryView from './ItineraryView';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/types/itinerary';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useItinerary } from '@/hooks/use-itinerary';

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
    setPanelCategoryWithCategoryName,
  } = useLeftPanel();

  // 다른 필요한 훅들을 사용하여 필요한 상태와 함수들을 가져옴
  const { dates, setDates } = useTripDetails();
  
  // 타입 오류 수정: 올바른 프로퍼티 사용
  const { selectedPlaces, handleSelectPlace } = useSelectedPlaces();
  
  const { 
    itinerary,
    generateItinerary,
    allCategoriesSelected
  } = useItinerary();

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

  // 임시로 viewPlaceOnMap 함수를 정의
  const viewPlaceOnMap = (place: Place) => {
    console.log("지도에서 장소 보기:", place);
    // 실제 구현은 지도 관련 훅이나 컨텍스트로부터 가져와야 함
  };

  // 각 카테고리별로 패널 뒤로가기 함수
  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    setActivePanel('region'); // Go back to region panel
  };

  // 결과 닫기 핸들러
  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    setPanelCategoryWithCategoryName(null);
    setItineraryPanelDisplayed(false);
  };

  // 카테고리 확인 핸들러
  const handleConfirmByCategory = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    // This function likely needs to interact with useLeftPanel logic
    return true; 
  };

  // 카테고리 선택 처리
  const handleCategorySelect = (categoryName: CategoryName) => {
    setPanelCategoryWithCategoryName(categoryName);
    setActivePanel('category');
  };

  // 선택된 장소 제거 핸들러
  const removePlace = (placeId: string) => {
    console.log("장소 제거:", placeId);
    if (handleSelectPlace) {
      // false를 전달해서 선택 해제
      const placeToRemove = selectedPlaces.find(p => p.id === placeId);
      if (placeToRemove) {
        handleSelectPlace(placeToRemove, false);
      }
    }
  };

  // Placeholder functions for compatibility with existing code
  const regionSelection = {
    regionSlidePanelOpen: isRegionPanelActive,
    setRegionSlidePanelOpen: (open: boolean) => open ? openRegionPanel() : setActivePanel('date'),
    selectedRegions: [],
    handleRegionToggle: (region: string) => { /* TODO: Implement using useLeftPanel/useTripDetails */ },
    setRegionConfirmed: (confirmed: boolean) => { if (confirmed) setActivePanel('category'); },
    regionConfirmed: false
  };
  
  const categorySelection = {
    handleCategoryButtonClick: handleCategorySelect,
    stepIndex: 0,
    activeMiddlePanelCategory: activePanel === 'category' ? '숙소' as CategoryName : null,
    confirmedCategories: [],
    selectedKeywordsByCategory: {},
    toggleKeyword: (category: string, keyword: string) => { /* TODO: Implement */ },
    isCategoryButtonEnabled: () => true
  };
  
  const keywordsAndInputs = {
    directInputValues: {
      accommodation: '', 
      landmark: '',
      restaurant: '',
      cafe: ''
    },
    onDirectInputChange: (category: string, value: string) => { /* TODO: Implement */ },
    handleConfirmCategory: handleConfirmByCategory
  };
  
  const placesManagement = {
    selectedPlaces: selectedPlaces || [],
    handleRemovePlace: removePlace,
    handleViewOnMap: viewPlaceOnMap,
    handleSelectPlace: (place: Place) => { /* TODO: Implement place selection logic */ },
    allCategoriesSelected: allCategoriesSelected || false,
  };
    
  const uiVisibility = {
    showItinerary: itineraryPanelDisplayed,
    setShowItinerary: setItineraryPanelDisplayed,
    showCategoryResult: false,
    setShowCategoryResult: (show: boolean) => {
      console.log("Category result visibility:", show);
    }
  };

  // itinerary 타입 변환 (Itinerary -> ItineraryDay[])
  const itineraryDays = itinerary ? (Array.isArray(itinerary) ? itinerary : []) : [];
  
  const itineraryManagement = {
    itinerary: itineraryDays,
    selectedItineraryDay: selectedDay,
    handleSelectItineraryDay: setSelectedDay
  };
  
  const handleActualCreateItinerary = async () => {
    if (generateItinerary) {
      try {
        const result = await generateItinerary();
        if (result) {
          setItineraryCreated(true);
          openItineraryPanel();
          return true;
        }
      } catch (error) {
        console.error("일정 생성 중 오류 발생:", error);
      }
    }
    return false;
  };

  return (
    <div className="relative h-full">
      {uiVisibility.showItinerary && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary}
            startDate={dates?.startDate || new Date()}
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
            startDate: dates?.startDate || null,
            endDate: dates?.endDate || null,
            startTime: dates?.startTime || "09:00",
            endTime: dates?.endTime || "21:00"
          }}
          onCreateItinerary={handleActualCreateItinerary}
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
        >
          <LeftPanelContent
            onDateSelect={setDates}
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!(dates?.startDate && dates?.endDate)}
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
              accomodation: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('숙소', finalKeywords),
              landmark: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('관광지', finalKeywords),
              restaurant: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('음식점', finalKeywords),
              cafe: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('카페', finalKeywords)
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
        showCategoryResult={null}
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
