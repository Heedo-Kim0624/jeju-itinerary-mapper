
import { useMemo } from 'react';
import { Place, ItineraryDay } from '@/types';
import { CategoryName } from '@/utils/categoryUtils';

interface LeftPanelPropsData {
  // Navigation and panel states
  uiVisibility: {
    showItinerary: boolean;
    setShowItinerary: (show: boolean) => void;
    showCategoryResult: CategoryName | null;
    setShowCategoryResult: (category: CategoryName | null) => void;
  };
  currentPanel: 'region' | 'date' | 'category' | 'itinerary';
  isGeneratingItinerary: boolean;
  itineraryReceived: boolean;
  
  // Itinerary data
  itineraryManagement: {
    itinerary: ItineraryDay[] | null;
    selectedItineraryDay: number | null;
    handleSelectItineraryDay: (day: number) => void;
    isItineraryCreated?: boolean; // 선택적으로 추가
  };
  
  // Trip details
  tripDetails: {
    dates?: {
      startDate: Date | null;
      endDate: Date | null;
      startTime: string;
      endTime: string;
    };
    setDates: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string }) => void;
  };
  
  // Place management
  placesManagement: {
    selectedPlaces: Place[];
    handleRemovePlace: (id: string) => void;
    handleViewOnMap: (place: Place) => void;
    handleSelectPlace: (place: Place, checked: boolean, category: string | null) => void;
    allCategoriesSelected: boolean;
    allFetchedPlaces?: Place[]; // 선택적으로 추가
  };
  
  // Category and region selection
  categorySelection: {
    handleCategoryButtonClick: (category: string) => void;
    stepIndex: number;
    activeMiddlePanelCategory: string | null;
    confirmedCategories: string[];
    selectedKeywordsByCategory: Record<string, string[]>;
    toggleKeyword: (category: string, keyword: string) => void;
    isCategoryButtonEnabled: (category: string) => boolean;
    handlePanelBack: () => void;
  };
  
  // 선택적으로 추가
  regionSelection?: {
    selectedRegions: string[];
    regionConfirmed: boolean;
    setRegionConfirmed: (confirmed: boolean) => void;
    regionSlidePanelOpen: boolean;
    setRegionSlidePanelOpen: (open: boolean) => void;
    handleRegionToggle: (region: string) => void;
  };
  
  // Input state
  keywordsAndInputs: {
    directInputValues: Record<string, string>;
    onDirectInputChange: (category: string, value: string) => void;
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean) => void;
  };
  
  // Category result handling
  categoryResultHandlers: {
    handleResultClose: () => void;
    handleConfirmCategoryWithAutoComplete: (category: string, selectedPlaces: Place[], recommendedPlaces: Place[]) => void;
  };
  
  // Itinerary creation/closing
  handleCloseItinerary: () => void;
  handleCreateItinerary?: () => Promise<void>; // 선택적으로 추가
}

export const useLeftPanelProps = (leftPanelData: LeftPanelPropsData) => {
  // Derive itinerary display props
  const itineraryDisplayProps = useMemo(() => {
    const { uiVisibility, itineraryManagement, tripDetails, handleCloseItinerary } = leftPanelData;
    
    return uiVisibility.showItinerary ? {
      itinerary: itineraryManagement.itinerary || [],
      startDate: tripDetails.dates?.startDate || new Date(),
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      selectedDay: itineraryManagement.selectedItineraryDay,
      onCloseItinerary: handleCloseItinerary,
      debug: {
        itineraryLength: itineraryManagement.itinerary?.length || 0,
        selectedDay: itineraryManagement.selectedItineraryDay,
        showItinerary: uiVisibility.showItinerary,
      },
    } : null;
  }, [
    leftPanelData.uiVisibility,
    leftPanelData.itineraryManagement.itinerary,
    leftPanelData.itineraryManagement.selectedItineraryDay,
    leftPanelData.tripDetails.dates?.startDate,
    leftPanelData.handleCloseItinerary
  ]);

  // Derive main panel container props
  const leftPanelContainerProps = useMemo(() => {
    const { 
      uiVisibility, 
      placesManagement, 
      tripDetails, 
      itineraryManagement, 
      isGeneratingItinerary 
    } = leftPanelData;
    
    return !isGeneratingItinerary && !uiVisibility.showItinerary ? {
      showItinerary: uiVisibility.showItinerary,
      onSetShowItinerary: uiVisibility.setShowItinerary,
      selectedPlaces: placesManagement.selectedPlaces,
      onRemovePlace: placesManagement.handleRemovePlace,
      onViewOnMap: placesManagement.handleViewOnMap,
      allCategoriesSelected: placesManagement.allCategoriesSelected,
      dates: {
        startDate: tripDetails.dates?.startDate || null,
        endDate: tripDetails.dates?.endDate || null,
        startTime: tripDetails.dates?.startTime || "09:00",
        endTime: tripDetails.dates?.endTime || "21:00",
      },
      itinerary: itineraryManagement.itinerary,
      selectedItineraryDay: itineraryManagement.selectedItineraryDay,
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      isGenerating: isGeneratingItinerary,
    } : null;
  }, [
    leftPanelData.uiVisibility,
    leftPanelData.placesManagement,
    leftPanelData.tripDetails,
    leftPanelData.itineraryManagement, 
    leftPanelData.isGeneratingItinerary
  ]);

  // Derive main panel content props
  const leftPanelContentProps = useMemo(() => {
    const { 
      categorySelection, 
      tripDetails, 
      regionSelection, 
      keywordsAndInputs,
      isGeneratingItinerary 
    } = leftPanelData;
    
    return !isGeneratingItinerary && !leftPanelData.uiVisibility.showItinerary ? {
      onDateSelect: tripDetails.setDates,
      onOpenRegionPanel: () => regionSelection.setRegionSlidePanelOpen(true),
      hasSelectedDates: !!tripDetails.dates?.startDate && !!tripDetails.dates?.endDate,
      onCategoryClick: categorySelection.handleCategoryButtonClick,
      regionConfirmed: regionSelection.regionConfirmed,
      categoryStepIndex: categorySelection.stepIndex,
      activeMiddlePanelCategory: categorySelection.activeMiddlePanelCategory,
      confirmedCategories: categorySelection.confirmedCategories,
      selectedKeywordsByCategory: categorySelection.selectedKeywordsByCategory,
      toggleKeyword: categorySelection.toggleKeyword,
      directInputValues: {
        accomodation: keywordsAndInputs.directInputValues['숙소'] || '',
        landmark: keywordsAndInputs.directInputValues['관광지'] || '',
        restaurant: keywordsAndInputs.directInputValues['음식점'] || '',
        cafe: keywordsAndInputs.directInputValues['카페'] || '',
      },
      onDirectInputChange: {
        accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('숙소', value),
        landmark: (value: string) => keywordsAndInputs.onDirectInputChange('관광지', value),
        restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('음식점', value),
        cafe: (value: string) => keywordsAndInputs.onDirectInputChange('카페', value),
      },
      isCategoryButtonEnabled: categorySelection.isCategoryButtonEnabled,
      isGenerating: isGeneratingItinerary,
    } : null;
  }, [
    leftPanelData.categorySelection,
    leftPanelData.tripDetails,
    leftPanelData.regionSelection,
    leftPanelData.keywordsAndInputs,
    leftPanelData.isGeneratingItinerary,
    leftPanelData.uiVisibility.showItinerary
  ]);

  // Combine container and content props
  const mainPanelProps = useMemo(() => {
    if (leftPanelContainerProps && leftPanelContentProps) {
      return { leftPanelContainerProps, leftPanelContentProps };
    }
    return null;
  }, [leftPanelContainerProps, leftPanelContentProps]);

  // Debug info props
  const devDebugInfoProps = useMemo(() => {
    const { 
      uiVisibility, 
      itineraryManagement, 
      isGeneratingItinerary, 
      itineraryReceived,
      tripDetails 
    } = leftPanelData;
    
    return {
      showItineraryHook: uiVisibility.showItinerary,
      itineraryHook: itineraryManagement.itinerary,
      selectedDayHook: itineraryManagement.selectedItineraryDay,
      isGeneratingPanel: isGeneratingItinerary,
      itineraryReceivedPanel: itineraryReceived,
      tripStartDate: tripDetails.dates?.startDate,
    };
  }, [
    leftPanelData.uiVisibility,
    leftPanelData.itineraryManagement,
    leftPanelData.isGeneratingItinerary,
    leftPanelData.itineraryReceived,
    leftPanelData.tripDetails.dates?.startDate
  ]);

  return {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps
  };
};
