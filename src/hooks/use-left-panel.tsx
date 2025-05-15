
import { useState, useCallback, useEffect } from 'react';
import { Place, SchedulePayload } from '@/types/supabase';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { useItinerary } from './use-itinerary';
import { toast } from 'sonner';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';

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
  // Create objects to group related functionality
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetails = useTripDetails();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryResultScreen, setShowCategoryResultScreen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<string | null>(null);
  
  // Direct input state management
  const [accommodationDirectInput, setAccommodationDirectInput] = useState('');
  const [landmarkDirectInput, setLandmarkDirectInput] = useState('');
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  const [cafeDirectInput, setCafeDirectInput] = useState('');

  const keywordsAndInputs = {
    directInputValues: {
      'accommodation': accommodationDirectInput,
      'landmark': landmarkDirectInput,
      'restaurant': restaurantDirectInput,
      'cafe': cafeDirectInput
    },
    onDirectInputChange: (category: string, value: string) => {
      switch (category) {
        case 'accommodation':
          setAccommodationDirectInput(value);
          break;
        case 'landmark':
          setLandmarkDirectInput(value);
          break;
        case 'restaurant':
          setRestaurantDirectInput(value);
          break;
        case 'cafe':
          setCafeDirectInput(value);
          break;
      }
    },
    handleConfirmCategory: (category: string, finalKeywords: string[], showResults: boolean = false) => {
      categorySelection.handleConfirmCategory(category as any, finalKeywords, true);
      if (showResults) {
        setShowCategoryResult(category);
      }
    }
  };

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

  const uiVisibility = {
    showItinerary,
    setShowItinerary,
    showCategoryResult,
    setShowCategoryResult
  };

  const { clearMarkersAndUiElements } = useMapContext();

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

  const handleCategorySelect = useCallback((category: string) => {
    console.log(`Category selected: ${category}`);
    setSelectedCategory(category);
    setShowCategoryResultScreen(true);
    setCurrentPanel('category');
    refetch(); // Use refetch instead of direct fetchCategoryData
  }, [refetch]);

  const handleCloseCategoryResult = () => {
    setShowCategoryResult(null);
  };
  
  const handleConfirmCategory = useCallback(() => {
    if (selectedCategory) {
      // This might be where you want to add selected places from this category
      // For now, it just closes the panel
      console.log(`${selectedCategory} 선택 완료`);
    }
    setShowCategoryResultScreen(false);
    setCurrentPanel('category'); // Return to main category selection
  }, [selectedCategory]);

  const handleCreateItinerary = async () => {
    if (!tripDetails.dates) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }

    // Group recommendedPlaces by Korean category name
    const recommendedPlacesGroupedByCategory: Record<string, Place[]> = {};
    if (recommendedPlaces) {
      recommendedPlaces.forEach(place => {
        const koreanCategoryKey = engToKorCategory(place.category);
        if (!recommendedPlacesGroupedByCategory[koreanCategoryKey]) {
            recommendedPlacesGroupedByCategory[koreanCategoryKey] = [];
        }
        recommendedPlacesGroupedByCategory[koreanCategoryKey].push(place);
      });
    }
    console.log("추천 장소 (카테고리별 그룹화):", recommendedPlacesGroupedByCategory);

    const dateTimeInfo = tripDetails.dates ? {
      start_datetime: new Date(tripDetails.dates.startDate.setHours(
        parseInt(tripDetails.dates.startTime.split(':')[0]), 
        parseInt(tripDetails.dates.startTime.split(':')[1])
      )).toISOString(),
      end_datetime: new Date(tripDetails.dates.endDate.setHours(
        parseInt(tripDetails.dates.endTime.split(':')[0]), 
        parseInt(tripDetails.dates.endTime.split(':')[1])
      )).toISOString(),
    } : null;

    // Pass the grouped recommended places
    const payload = prepareSchedulePayload(selectedPlaces, dateTimeInfo, recommendedPlacesGroupedByCategory);

    if (payload) {
      console.log("경로 생성 버튼 클릭됨, 경로 생성 함수 호출");
      const result = generateItinerary(
        selectedPlaces, 
        tripDetails.dates.startDate, 
        tripDetails.dates.endDate, 
        tripDetails.dates.startTime, 
        tripDetails.dates.endTime
      );
      setShowItinerary(true);
      setCurrentPanel('itinerary');
      return !!result;
    } else {
      console.error("일정 생성에 필요한 정보가 부족합니다.");
      return false;
    }
  };

  const handleCloseItinerary = () => {
    setShowItinerary(false);
    clearMarkersAndUiElements(); // Clear map markers and routes
    setCurrentPanel('category'); // Or to the last relevant panel
  };

  // Effect to select first day when itinerary is created
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && showItinerary) {
      setSelectedItineraryDay(itinerary[0]?.day || 1);
    }
  }, [itinerary, showItinerary, setSelectedItineraryDay]);

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary,
    selectedCategory,
    showCategoryResultScreen,
    currentPanel,
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory,
    handleCloseItinerary
  };
};
