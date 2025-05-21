
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
    isItineraryCreated?: boolean;
    // Potentially add handleServerItineraryResponse, showItinerary, setShowItinerary if needed by props consuming this
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
    allFetchedPlaces?: Place[];
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
    handlePanelBack: () => void; // Simple version for some uses
  };
  
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
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean) => void; // Simple version for some uses
  };
  
  // Category result handling
  categoryResultHandlers: {
    handleResultClose: () => void;
    handleConfirmCategoryWithAutoComplete: (category: string, selectedPlaces: Place[], recommendedPlaces: Place[]) => void;
  };
  
  // Itinerary creation/closing
  handleCloseItinerary: () => void;
  handleCreateItinerary?: () => Promise<void>;

  // Structured Callbacks required for LeftPanelContent via MainPanelWrapper
  onConfirmCategoryCallbacks: {
    accomodation: (finalKeywords: string[]) => void;
    landmark: (finalKeywords: string[]) => void;
    restaurant: (finalKeywords: string[]) => void;
    cafe: (finalKeywords: string[]) => void;
  };
  handlePanelBackCallbacks: {
    accomodation: () => void;
    landmark: () => void;
    restaurant: () => void;
    cafe: () => void;
  };
}

export const useLeftPanelProps = (leftPanelData: LeftPanelPropsData) => {
  const { 
    uiVisibility, 
    itineraryManagement, 
    tripDetails, 
    handleCloseItinerary,
    placesManagement,
    isGeneratingItinerary,
    categorySelection,
    regionSelection,
    keywordsAndInputs,
    onConfirmCategoryCallbacks, // Destructure for use
    handlePanelBackCallbacks   // Destructure for use
  } = leftPanelData;

  // Derive itinerary display props
  const itineraryDisplayProps = useMemo(() => {
    return uiVisibility.showItinerary && itineraryManagement.itinerary ? { // Ensure itinerary is not null
      itinerary: itineraryManagement.itinerary,
      startDate: tripDetails.dates?.startDate || new Date(),
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      selectedDay: itineraryManagement.selectedItineraryDay,
      onCloseItinerary: handleCloseItinerary,
      // handleClosePanelWithBackButton will be added in LeftPanel.tsx
      debug: {
        itineraryLength: itineraryManagement.itinerary?.length || 0,
        selectedDay: itineraryManagement.selectedItineraryDay,
        showItinerary: uiVisibility.showItinerary,
      },
    } : null;
  }, [
    uiVisibility, // uiVisibility.showItinerary
    itineraryManagement, // itineraryManagement.itinerary, itineraryManagement.selectedItineraryDay, itineraryManagement.handleSelectItineraryDay
    tripDetails.dates?.startDate,
    handleCloseItinerary
  ]);

  // Derive main panel container props
  const leftPanelContainerProps = useMemo(() => {
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
      // onCreateItinerary will be added in LeftPanel.tsx
      itinerary: itineraryManagement.itinerary,
      selectedItineraryDay: itineraryManagement.selectedItineraryDay,
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      isGenerating: isGeneratingItinerary,
    } : null;
  }, [
    uiVisibility, // uiVisibility.showItinerary, uiVisibility.setShowItinerary
    placesManagement, // placesManagement.selectedPlaces, placesManagement.handleRemovePlace, placesManagement.handleViewOnMap, placesManagement.allCategoriesSelected
    tripDetails.dates, // tripDetails.dates (for startDate, endDate, startTime, endTime)
    itineraryManagement, // itineraryManagement.itinerary, itineraryManagement.selectedItineraryDay, itineraryManagement.handleSelectItineraryDay
    isGeneratingItinerary
  ]);

  // Derive main panel content props
  const leftPanelContentProps = useMemo(() => {
    if (isGeneratingItinerary || uiVisibility.showItinerary || !regionSelection) {
      return null;
    }
    
    return {
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
      // Add the required callback objects
      onConfirmCategoryCallbacks: onConfirmCategoryCallbacks,
      handlePanelBackCallbacks: handlePanelBackCallbacks,
    };
  }, [
    categorySelection, // All its properties
    tripDetails, // tripDetails.setDates, tripDetails.dates
    regionSelection, // regionSelection.setRegionSlidePanelOpen, regionSelection.regionConfirmed
    keywordsAndInputs, // keywordsAndInputs.directInputValues, keywordsAndInputs.onDirectInputChange
    isGeneratingItinerary,
    uiVisibility.showItinerary, // uiVisibility.showItinerary
    onConfirmCategoryCallbacks, // New dependency
    handlePanelBackCallbacks    // New dependency
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
      uiVisibility: LPUiVisibility, // Renamed to avoid conflict
      itineraryManagement: LPItineraryManagement, 
      isGeneratingItinerary: LPIsGeneratingItinerary, 
      itineraryReceived,
      tripDetails: LPTripDetails 
    } = leftPanelData;
    
    return {
      showItineraryHook: LPUiVisibility.showItinerary,
      itineraryHook: LPItineraryManagement.itinerary,
      selectedDayHook: LPItineraryManagement.selectedItineraryDay,
      isGeneratingPanel: LPIsGeneratingItinerary,
      itineraryReceivedPanel: itineraryReceived,
      tripStartDate: LPTripDetails.dates?.startDate,
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
