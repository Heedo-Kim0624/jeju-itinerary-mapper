
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { CategoryName } from '@/utils/categoryUtils';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';
import ItineraryView from './ItineraryView';
import { Place } from '@/types/supabase'; // Added for placesManagement
import { ItineraryDay } from '@/types/itinerary'; // Added for itineraryManagement

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
    dates, // Use dates from useLeftPanel (which comes from useTripDetails)
    setDates, // Use setDates from useLeftPanel (which comes from useTripDetails)
    itinerary, // Use itinerary from useLeftPanel
    // Add other necessary state/functions from useLeftPanel if they were part of the old tripDetails placeholder
    selectedPlaces, // Assuming this comes from useLeftPanel -> useTripDetails or similar
    removePlace, // Assuming this comes from useLeftPanel
    viewPlaceOnMap, // Assuming this comes from useLeftPanel
    allCategoriesConfirmed, // Assuming this is the equivalent of allCategoriesSelected
    createItinerary, // The actual createItinerary function from useLeftPanel
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
    setPanelCategoryWithCategoryName(null); // Or setActivePanel('region') or similar logic
    setItineraryPanelDisplayed(false); // This might need re-evaluation based on desired UX
  };

  // 카테고리 확인 핸들러
  const handleConfirmByCategory = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    // This function likely needs to interact with useLeftPanel logic
    // For now, returning true as a placeholder if it was expected.
    // The actual logic might involve setting panel category or fetching results.
    return true; 
  };

  // 카테고리 선택 처리
  const handleCategorySelect = (categoryName: CategoryName) => {
    setPanelCategoryWithCategoryName(categoryName);
    setActivePanel('category'); // Or specific category panel
  };

  // Placeholder functions for compatibility with existing code (to be replaced or refined)
  const regionSelection = {
    regionSlidePanelOpen: isRegionPanelActive, // Reflect actual panel state
    setRegionSlidePanelOpen: (open: boolean) => open ? openRegionPanel() : setActivePanel('date'), // Or a more specific close action
    selectedRegions: [], // This should come from useLeftPanel or useTripDetails
    handleRegionToggle: (region: string) => { /* TODO: Implement using useLeftPanel/useTripDetails */ },
    setRegionConfirmed: (confirmed: boolean) => { if (confirmed) setActivePanel('category'); /* TODO: Store confirmation */ },
    regionConfirmed: false // This should come from useLeftPanel or useTripDetails (e.g., selectedRegions.length > 0)
  };
  
  const categorySelection = {
    handleCategoryButtonClick: handleCategorySelect, // Use the new handler
    stepIndex: 0, // This state needs to be managed, perhaps in useLeftPanel
    activeMiddlePanelCategory: activePanel === 'category' ? 'some_category' : null, // Derive from activePanel or specific state
    confirmedCategories: [], // Should come from useLeftPanel/useTripDetails
    selectedKeywordsByCategory: {}, // Should come from useLeftPanel/useTripDetails
    toggleKeyword: (category: string, keyword: string) => { /* TODO: Implement */ },
    isCategoryButtonEnabled: () => true // TODO: Implement actual logic
  };
  
  const keywordsAndInputs = {
    directInputValues: { // These should come from useLeftPanel -> useTripDetails
      accommodation: '', 
      landmark: '',
      restaurant: '',
      cafe: ''
    },
    onDirectInputChange: (category: string, value: string) => { /* TODO: Implement */ },
    handleConfirmCategory: handleConfirmByCategory // Use the new handler
  };
  
  const placesManagement = {
    selectedPlaces: selectedPlaces || [],
    handleRemovePlace: removePlace || ((id: string) => console.warn("removePlace not implemented")),
    handleViewOnMap: viewPlaceOnMap || ((place: Place) => console.warn("viewPlaceOnMap not implemented")),
    handleSelectPlace: (place: Place) => { /* TODO: Implement place selection logic, possibly updating selectedPlaces */ },
    allCategoriesSelected: allCategoriesConfirmed || false, // Use the state from useLeftPanel
  };
    
  const uiVisibility = {
    showItinerary: itineraryPanelDisplayed,
    setShowItinerary: setItineraryPanelDisplayed,
    showCategoryResult: activePanel === 'categoryResult' ? 'some_category_for_result' : null, // Derive from activePanel
    setShowCategoryResult: (category: string | null) => {
      if (category) setActivePanel('categoryResult'); // Or set specific panel state
      else handleResultClose();
    }
  };
  
  const itineraryManagement = {
    itinerary: itinerary,
    selectedItineraryDay: selectedDay,
    handleSelectItineraryDay: setSelectedDay
  };
  
  const handleActualCreateItinerary = async () => {
    if (createItinerary) {
      const result = await createItinerary(); // Call the actual function from useLeftPanel
      if (result) {
        setItineraryCreated(true);
        openItineraryPanel(); // Or setItineraryPanelDisplayed(true)
        return true;
      }
    }
    return false;
  };

  return (
    <div className="relative h-full">
      {uiVisibility.showItinerary && itineraryManagement.itinerary ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary as ItineraryDay[]} // Cast if itinerary from hook can be null
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
          dates={{ // Use dates from useLeftPanel
            startDate: dates?.startDate || null,
            endDate: dates?.endDate || null,
            startTime: dates?.startTime || "09:00",
            endTime: dates?.endTime || "21:00"
          }}
          onCreateItinerary={handleActualCreateItinerary} // Use the actual async handler
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
        >
          <LeftPanelContent
            onDateSelect={setDates} // Use setDates from useLeftPanel
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!(dates?.startDate && dates?.endDate)} // Derive from actual dates
            onCategoryClick={categorySelection.handleCategoryButtonClick}
            regionConfirmed={regionSelection.regionConfirmed}
            categoryStepIndex={categorySelection.stepIndex}
            activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory}
            confirmedCategories={categorySelection.confirmedCategories}
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            toggleKeyword={categorySelection.toggleKeyword}
            directInputValues={{ // These should come from useLeftPanel -> useTripDetails
              accomodation: keywordsAndInputs.directInputValues['accommodation'] || '',
              landmark: keywordsAndInputs.directInputValues['landmark'] || '',
              restaurant: keywordsAndInputs.directInputValues['restaurant'] || '',
              cafe: keywordsAndInputs.directInputValues['cafe'] || ''
            }}
            onDirectInputChange={{ // TODO: Wire these up to useLeftPanel -> useTripDetails setters
              accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('accommodation', value),
              landmark: (value: string) => keywordsAndInputs.onDirectInputChange('landmark', value),
              restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('restaurant', value),
              cafe: (value: string) => keywordsAndInputs.onDirectInputChange('cafe', value)
            }}
            onConfirmCategory={{
              accomodation: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('숙소', finalKeywords, true),
              landmark: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('관광지', finalKeywords, true),
              restaurant: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('음식점', finalKeywords, true),
              cafe: (finalKeywords: string[]) => keywordsAndInputs.handleConfirmCategory('카페', finalKeywords, true)
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
          else alert('지역을 선택해주세요.'); // This alert is fine here
        }}
      />

      <CategoryResultHandler // This component might need to be reviewed for how it gets its data
        showCategoryResult={uiVisibility.showCategoryResult} // This needs careful wiring
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

