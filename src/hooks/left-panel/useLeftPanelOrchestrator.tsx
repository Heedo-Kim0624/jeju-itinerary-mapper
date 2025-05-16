
import { useEffect, useCallback } from 'react';
import { useLeftPanel, LeftPanelTab } from '@/hooks/use-left-panel';
import { CategoryName } from '@/utils/categoryUtils';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/types/itinerary';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useSelectedPlaces } from '@/hooks/use-selected-places';
import { useItinerary } from '@/hooks/use-itinerary';

export const useLeftPanelOrchestrator = () => {
  const {
    activePanel,
    isRegionPanelActive,
    // isDatePanelActive, // Not directly used by LeftPanel.tsx presentation logic after refactor
    // isCategoryPanelActive, // Not directly used by LeftPanel.tsx presentation logic after refactor
    // isItineraryPanelActive, // Not directly used by LeftPanel.tsx presentation logic after refactor
    itineraryCreated,
    itineraryPanelDisplayed,
    selectedDay,
    setActivePanel,
    openRegionPanel,
    // openDatePanel, // Not directly used
    // openCategoryPanel, // Not directly used
    openItineraryPanel,
    setItineraryCreated,
    setItineraryPanelDisplayed,
    setSelectedDay,
    // getDayPlaces, // Not directly used
    // findDayByPlaceId, // Not directly used
    setPanelCategoryWithCategoryName,
  } = useLeftPanel();

  const { dates, setDates } = useTripDetails();
  const { selectedPlaces, handleSelectPlace } = useSelectedPlaces();
  const { 
    itinerary,
    generateItinerary, // This is () => Promise<ItineraryDay[] | null>
    allCategoriesSelected // This is boolean
  } = useItinerary();

  useEffect(() => {
    console.log("LeftPanelOrchestrator - 일정 관련 상태 변화 감지:", {
      일정생성됨: itineraryCreated,
      일정패널표시: itineraryPanelDisplayed,
      선택된일자: selectedDay
    });
  }, [itineraryCreated, itineraryPanelDisplayed, selectedDay]);

  const viewPlaceOnMap = useCallback((place: Place) => {
    console.log("지도에서 장소 보기:", place);
    // 실제 구현은 지도 관련 훅이나 컨텍스트로부터 가져와야 함
  }, []);

  const handlePanelBackByCategory = useCallback((_category: string) => {
    // console.log(`${_category} 카테고리 패널 뒤로가기`);
    setActivePanel('region');
  }, [setActivePanel]);

  const handleResultClose = useCallback(() => {
    console.log("카테고리 결과 화면 닫기");
    setPanelCategoryWithCategoryName(null as any); // TODO: Fix type if null is not CategoryName
    setItineraryPanelDisplayed(false);
  }, [setPanelCategoryWithCategoryName, setItineraryPanelDisplayed]);

  const handleConfirmByCategory = useCallback((category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    return true; 
  }, []);

  const handleCategorySelect = useCallback((categoryName: CategoryName) => {
    setPanelCategoryWithCategoryName(categoryName);
    setActivePanel('category');
  }, [setPanelCategoryWithCategoryName, setActivePanel]);

  const removePlace = useCallback((placeId: string) => {
    console.log("장소 제거:", placeId);
    if (handleSelectPlace) {
      const placeToRemove = selectedPlaces.find(p => p.id === placeId);
      if (placeToRemove) {
        handleSelectPlace(placeToRemove, false);
      }
    }
  }, [selectedPlaces, handleSelectPlace]);
  
  const regionSelection = {
    regionSlidePanelOpen: isRegionPanelActive,
    setRegionSlidePanelOpen: (open: boolean) => open ? openRegionPanel() : setActivePanel('date' as LeftPanelTab), // Cast to LeftPanelTab
    selectedRegions: [], // Placeholder - should come from a real source if used
    handleRegionToggle: (_region: string) => { /* TODO: Implement */ },
    setRegionConfirmed: (confirmed: boolean) => { if (confirmed) setActivePanel('category' as LeftPanelTab); }, // Cast
    regionConfirmed: false // Placeholder
  };
  
  const categorySelection = {
    handleCategoryButtonClick: handleCategorySelect,
    stepIndex: 0, // Placeholder
    activeMiddlePanelCategory: activePanel === 'category' ? '숙소' as CategoryName : null, // Example
    confirmedCategories: [], // Placeholder
    selectedKeywordsByCategory: {}, // Placeholder
    toggleKeyword: (_category: string, _keyword: string) => { /* TODO: Implement */ },
    isCategoryButtonEnabled: () => true // Placeholder
  };
  
  const keywordsAndInputs = {
    directInputValues: {
      accommodation: '', 
      landmark: '',
      restaurant: '',
      cafe: ''
    }, // Placeholder
    onDirectInputChange: (_category: string, _value: string) => { /* TODO: Implement */ },
    handleConfirmCategory: handleConfirmByCategory
  };
  
  const placesManagement = {
    selectedPlaces: selectedPlaces || [],
    handleRemovePlace: removePlace,
    handleViewOnMap: viewPlaceOnMap,
    handleSelectPlace: (place: Place) => { 
        if (handleSelectPlace) {
            handleSelectPlace(place, true); // Assuming true means select
        }
    },
    allCategoriesSelected: allCategoriesSelected || false,
  };
    
  const uiVisibility = {
    showItinerary: itineraryPanelDisplayed,
    setShowItinerary: setItineraryPanelDisplayed,
    showCategoryResult: false, // Placeholder
    setShowCategoryResult: (_show: boolean) => {
      // console.log("Category result visibility:", _show);
    }
  };

  const itineraryDays = itinerary ? (Array.isArray(itinerary) ? itinerary : []) : [];
  
  const itineraryManagement = {
    itinerary: itineraryDays,
    selectedItineraryDay: selectedDay,
    handleSelectItineraryDay: setSelectedDay
  };
  
  const handleActualCreateItinerary = useCallback(async () => {
    if (generateItinerary) { // Check if function exists
      try {
        const result = await generateItinerary(); // Call the async function
        if (result && result.length > 0) { // Check if result is truthy and has items
          setItineraryCreated(true);
          openItineraryPanel();
          return true;
        }
      } catch (error) {
        console.error("일정 생성 중 오류 발생 (Orchestrator):", error);
      }
    }
    return false;
  }, [generateItinerary, setItineraryCreated, openItineraryPanel]);

  return {
    activePanel,
    dates,
    setDates,
    itineraryCreated,
    itineraryPanelDisplayed,
    selectedDay,
    setActivePanel,
    openRegionPanel,
    openItineraryPanel,
    setItineraryCreated,
    setItineraryPanelDisplayed,
    setSelectedDay,
    setPanelCategoryWithCategoryName,
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    uiVisibility,
    itineraryManagement,
    handleActualCreateItinerary,
    handlePanelBackByCategory, // Exported for LeftPanelContent
    handleResultClose, // Exported for CategoryResultHandler
  };
};

