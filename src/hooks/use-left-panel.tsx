import { useState, useCallback, useEffect } from 'react';
import { Place, SchedulePayload } from '@/types/supabase';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary';
import { toast } from 'sonner';
import { useMapContext } from '@/components/rightpanel/MapContext';

// Helper to convert English category to Korean
const engToKorCategory = (engCategory?: string): string => {
    if (!engCategory) return '기타';
    switch (engCategory.toLowerCase()) {
        case 'accommodation': return '숙소';
        case 'attraction': return '관광지';
        case 'restaurant': return '음식점';
        case 'cafe': return '카페';
        default: return '기타'; // Or handle as per application logic
    }
};

export const useLeftPanel = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryResultScreen, setShowCategoryResultScreen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showItineraryPanel, setShowItineraryPanel] = useState(false);

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

  const {
    dates,
    setDates,
    tripDuration,
    isDatePanelValid,
    dateError,
    setDateError,
    handleDateChange,
    handleTimeChange,
  } = useTripDetails();

  const {
    isRegionSelected,
    selectedRegions,
    handleRegionChange,
    confirmRegionSelection,
    resetRegions,
    getRegionDisplayName,
  } = useRegionSelection();

  const { 
    itinerary, 
    generateNewItinerary, 
    isLoading: isItineraryLoading, 
    error: itineraryError,
    selectedItineraryDay,
    setSelectedItineraryDay,
    isItineraryGenerated,
    setIsItineraryGenerated,
  } = useItinerary();

  const { 
    fetchCategoryData, 
    categoryResults, 
    isLoading: isCategoryLoading, 
    error: categoryError,
    clearCategoryResults,
    setCategoryResults,
  } = useCategoryResults(selectedRegions);
  
  const { clearMarkersAndUiElements } = useMapContext();


  const handleCategorySelect = useCallback((category: string) => {
    console.log(`Category selected: ${category}`);
    setSelectedCategory(category);
    setShowCategoryResultScreen(true);
    setCurrentPanel('category'); 
    fetchCategoryData(category, selectedRegions);
  }, [fetchCategoryData, selectedRegions]);

  const handleCloseCategoryResult = () => {
    setShowCategoryResultScreen(false);
    setSelectedCategory(null);
    clearCategoryResults(); 
    setCurrentPanel('category');
    console.log('카테고리 결과 화면 닫기');
  };
  
  const handleConfirmCategory = useCallback(() => {
    if (selectedCategory) {
      // This might be where you want to add selected places from this category
      // For now, it just closes the panel
      console.log(`${selectedCategory} 선택 완료`);
    }
    setShowCategoryResultScreen(false);
    // setSelectedCategory(null); // Keep selectedCategory if needed for PlaceCart logic
    setCurrentPanel('category'); // Return to main category selection
  }, [selectedCategory]);

  const handleNextPanel = (panel: 'region' | 'date' | 'category') => {
    if (panel === 'region') {
      if (isRegionSelected) {
        confirmRegionSelection();
        setCurrentPanel('date');
      } else {
        toast.error('지역을 선택해주세요.');
      }
    } else if (panel === 'date') {
      if (isDatePanelValid) {
        setCurrentPanel('category');
      } else {
        toast.error(dateError || '날짜와 시간을 올바르게 입력해주세요.');
      }
    }
  };

  const handlePrevPanel = (panel: 'date' | 'category') => {
    if (panel === 'date') {
      setCurrentPanel('region');
    } else if (panel === 'category') {
      setCurrentPanel('date');
    }
  };
  
  const handleShowItinerary = () => {
    if (!isDatePanelValid) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return;
    }
    if (selectedPlaces.length === 0 && !isItineraryGenerated) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }

    // Group recommendedPlaces by Korean category name
    const recommendedPlacesGroupedByCategory: Record<string, Place[]> = {};
    if (categoryResults.recommendedPlaces) {
        categoryResults.recommendedPlaces.forEach(place => {
            const koreanCategoryKey = engToKorCategory(place.category); // Use the helper
            if (!recommendedPlacesGroupedByCategory[koreanCategoryKey]) {
                recommendedPlacesGroupedByCategory[koreanCategoryKey] = [];
            }
            recommendedPlacesGroupedByCategory[koreanCategoryKey].push(place);
        });
    }
    console.log("추천 장소 (카테고리별 그룹화):", recommendedPlacesGroupedByCategory);


    const dateTimeInfo = dates ? {
      start_datetime: new Date(dates.startDate.setHours(parseInt(dates.startTime.split(':')[0]), parseInt(dates.startTime.split(':')[1]))).toISOString(),
      end_datetime: new Date(dates.endDate.setHours(parseInt(dates.endTime.split(':')[0]), parseInt(dates.endTime.split(':')[1]))).toISOString(),
    } : null;

    // Pass the grouped recommended places
    const payload = prepareSchedulePayload(selectedPlaces, dateTimeInfo, recommendedPlacesGroupedByCategory);

    if (payload) {
      console.log("경로 생성 버튼 클릭됨, 경로 생성 함수 호출");
      generateNewItinerary(payload); // This now triggers ScheduleGenerator via isItineraryGenerated
      setShowItineraryPanel(true);
      setCurrentPanel('itinerary');
    } else {
      console.error("일정 생성에 필요한 정보가 부족합니다.");
      // Toast error is handled within prepareSchedulePayload
    }
  };


  const handleCloseItinerary = () => {
    setShowItineraryPanel(false);
    setIsItineraryGenerated(false); // Reset generation flag
    clearMarkersAndUiElements(); // Clear map markers and routes
    setCurrentPanel('category'); // Or to the last relevant panel
  };
  
  // Effect to show itinerary panel when itinerary is generated
  useEffect(() => {
    if (isItineraryGenerated && itinerary.length > 0) {
      setShowItineraryPanel(true);
      setCurrentPanel('itinerary');
      // Set selected day to the first day of the itinerary
      setSelectedItineraryDay(itinerary[0]?.day || 1);
      console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
        일정생성됨: isItineraryGenerated,
        일정패널표시: showItineraryPanel,
        선택된일자: selectedItineraryDay
      });
    }
  }, [isItineraryGenerated, itinerary, setSelectedItineraryDay]);


  return {
    selectedCategory,
    showCategoryResultScreen,
    currentPanel,
    selectedPlaces,
    selectedPlacesByCategory,
    candidatePlaces,
    allCategoriesSelected,
    dates,
    tripDuration,
    isDatePanelValid,
    dateError,
    isRegionSelected,
    selectedRegions,
    itinerary,
    isItineraryLoading,
    itineraryError,
    showItineraryPanel,
    selectedItineraryDay,
    isItineraryGenerated,
    categoryResults,
    isCategoryLoading,
    categoryError,
    isAccommodationLimitReached,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory,
    handleNextPanel,
    handlePrevPanel,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    setDates, // from useTripDetails
    handleDateChange, // from useTripDetails
    handleTimeChange, // from useTripDetails
    setDateError, // from useTripDetails
    handleRegionChange, // from useRegionSelection
    resetRegions, // from useRegionSelection
    getRegionDisplayName, // from useRegionSelection
    handleShowItinerary,
    handleCloseItinerary,
    setSelectedItineraryDay,
    fetchCategoryData, // from useCategoryResults
    clearCategoryResults, // from useCategoryResults
    setCategoryResults, // from useCategoryResults
  };
};
