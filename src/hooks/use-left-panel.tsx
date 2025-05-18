import { useState, useCallback, useEffect } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
// useItinerary related imports are now mostly covered by useScheduleManagement or handled differently
import { ItineraryDay as DomainItineraryDay, Place, SelectedPlace } from '@/types/supabase'; // Ensure ItineraryDay is DomainItineraryDay
import { CategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers'; // Stays for close, etc.
import { useInputState } from './left-panel/use-input-state';
import { useScheduleManagement } from './useScheduleManagement'; // Central for schedule generation logic

/**
 * 왼쪽 패널 기능 통합 훅 
 */
export const useLeftPanel = () => {
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection();
  const tripDetailsHook = useTripDetails(); // Renamed to avoid conflict with destructured tripDetails
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // const [showCategoryResultScreen, setShowCategoryResultScreen] = useState(false); // Keep if used
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);
  
  const { directInputValues, onDirectInputChange } = useInputState();

  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category as CategoryName, finalKeywords, clearSelection);
      if (clearSelection) {
        setShowCategoryResult(category as CategoryName);
      }
    }
  };

  const placesManagementHook = useSelectedPlaces(); // Renamed
  const {
    selectedPlaces, // This is from useSelectedPlaces
    candidatePlaces, // This is from useSelectedPlaces
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    isAccommodationLimitReached,
    handleAutoCompletePlaces,
    isPlaceSelected
  } = placesManagementHook;

  // Combine selected and candidate places for schedule generation
  const allPlacesForSchedule = [...selectedPlaces, ...candidatePlaces];


  // Schedule Management via useScheduleManagement
  const {
    itinerary, // This is the generated itinerary data from useScheduleManagement
    selectedDay: scheduleSelectedDay, // This is the selected day from useScheduleManagement
    isLoading: isScheduleLoading, // Loading state from useScheduleManagement
    handleSelectDay: handleScheduleSelectDay, // Day selection handler from useScheduleManagement
    runScheduleGenerationProcess,
  } = useScheduleManagement({
    selectedPlaces: allPlacesForSchedule,
    dates: tripDetailsHook.dates.startDate && tripDetailsHook.dates.endDate ? { 
      startDate: tripDetailsHook.dates.startDate, 
      endDate: tripDetailsHook.dates.endDate, 
      startTime: tripDetailsHook.dates.startTime, 
      endTime: tripDetailsHook.dates.endTime 
    } : null,
    startDatetimeISO: tripDetailsHook.startDatetime, 
    endDatetimeISO: tripDetailsHook.endDatetime,     
  });

  // Local UI states for itinerary panel
  const [showItineraryPanel, setShowItineraryPanel] = useState<boolean>(false);
  const [isGeneratingScheduleLocal, setIsGeneratingScheduleLocal] = useState<boolean>(false);
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);

  // Sync local loading state with schedule management's loading state
  // Also, handle showing itinerary panel when loading finishes and itinerary is available
  useEffect(() => {
    console.log("[useLeftPanel] Syncing local loading state. isScheduleLoading:", isScheduleLoading, "Current local:", isGeneratingScheduleLocal);
    setIsGeneratingScheduleLocal(isScheduleLoading);

    if (!isScheduleLoading && itinerary && itinerary.length > 0) {
      console.log("[useLeftPanel] Schedule loading finished, itinerary available. Showing panel.", { itineraryLength: itinerary.length, currentShowState: showItineraryPanel});
      setShowItineraryPanel(true);
      setForceRefreshCounter(prev => prev + 1); // Trigger refresh if needed
    } else if (!isScheduleLoading && itinerary && itinerary.length === 0) {
      // Handle case where generation finishes but no itinerary (e.g. error or no places)
      console.log("[useLeftPanel] Schedule loading finished, but itinerary is empty. Not showing panel or hide if shown.");
      // setShowItineraryPanel(false); // Optionally hide if it was shown due to old data
    }
  }, [isScheduleLoading, itinerary, showItineraryPanel]); 


  // Listener for 'itineraryCreated' custom event (from useScheduleGenerationRunner)
  // This event might be redundant if the useEffect above correctly handles state from useScheduleManagement
  // However, keeping it as it was part of a previous fix and ensures direct reaction to event.
  // This useEffect updates different state pieces (from the old useItinerary hook context)
  // For now, let's assume the main state (itinerary, selectedDay) comes from useScheduleManagement
  // and showItineraryPanel is the local UI toggle.
  // The original `itineraryCreated` listener set `setItinerary` from `useItinerary`.
  // Now `itinerary` directly comes from `useScheduleManagement`. So this event listener
  // should primarily focus on `setShowItineraryPanel(true)` if the event signals success.
  
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: DomainItineraryDay[], selectedDay: number | null }>;
      console.log("[useLeftPanel] 'itineraryCreated' event received:", customEvent.detail);
      
      if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        setShowItineraryPanel(true);
      } else if (customEvent.detail.itinerary && customEvent.detail.itinerary.length === 0) {
        toast.info("일정은 생성되었으나 포함된 장소가 없습니다.");
      }
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated);
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, []); // Removed state setters that are now part of useScheduleManagement flow


  const uiVisibility = {
    showItinerary: showItineraryPanel, // Use local state for panel visibility
    setShowItinerary: setShowItineraryPanel,
    showCategoryResult,
    setShowCategoryResult
  };

  const categoryResultsHook = useCategoryResults(showCategoryResult, 
    showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
    regionSelection.selectedRegions);

  const categoryResults = {
    recommendedPlaces: categoryResultsHook.recommendedPlaces || [],
    normalPlaces: categoryResultsHook.normalPlaces || []
  };

  const categoryHandlers = useCategoryHandlers();
  const handleCategorySelect = (category: string) => categoryHandlers.handleCategorySelect(category, categoryResultsHook.refetch);
  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value)
  );
  const handleConfirmCategoryFromButton = () => categoryHandlers.handleConfirmCategory(selectedCategory);

  const itineraryHandlersOriginal = useItineraryHandlers(); // Original handlers for close, etc.
  
  // New schedule generation handler
  const handleGenerateSchedule = useCallback(async () => {
    if (!tripDetailsHook.dates.startDate || !tripDetailsHook.dates.endDate) {
      toast.error("여행 날짜를 먼저 선택해주세요.");
      return false; // Indicate failure
    }
    if (allPlacesForSchedule.length === 0) {
      toast.error("최소 1개 이상의 장소를 선택해주세요.");
      return false; // Indicate failure
    }

    console.log("[useLeftPanel] Schedule generation initiated.");
    setIsGeneratingScheduleLocal(true); // Start local loading indicator
    setShowItineraryPanel(false); // Hide itinerary panel while generating new one

    try {
      await runScheduleGenerationProcess(); // This updates itinerary & selectedDay in useScheduleManagement
      // The useEffect watching isScheduleLoading will handle setShowItineraryPanel(true)
      console.log("[useLeftPanel] Schedule generation process completed (runScheduleGenerationProcess finished).");
      return true; // Indicate success of initiating
    } catch (error) {
      console.error("[useLeftPanel] Error during schedule generation process:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      setIsGeneratingScheduleLocal(false); // Ensure loading stops on error
      return false; // Indicate failure
    }
  }, [tripDetailsHook.dates, allPlacesForSchedule, runScheduleGenerationProcess]);
  
  const handleCloseItinerary = useCallback(() => {
    setShowItineraryPanel(false);
    // Call original handler if it does more, e.g., map cleanup
    // Now setCurrentPanel can be passed directly as its type matches the expected signature
    itineraryHandlersOriginal.handleCloseItinerary(setShowItineraryPanel, setCurrentPanel);
  }, [itineraryHandlersOriginal, setCurrentPanel, setShowItineraryPanel]);

  const forceRefresh = useCallback(() => {
    setForceRefreshCounter(prev => prev + 1);
  }, []);

  // Ensure selectedItineraryDay is correctly passed for ItineraryView
  // It now comes from useScheduleManagement as scheduleSelectedDay
  const selectedItineraryDayForView = scheduleSelectedDay;


  // Retain original structure for placesManagement but use the hook's instance
  const placesManagement = {
    ...placesManagementHook, // Spread all properties from the hook
    // selectedPlaces and candidatePlaces are already destructured above
  };

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement, // Use the full object from the hook
    tripDetails: tripDetailsHook, // Pass the full tripDetailsHook object
    uiVisibility, // Contains showItineraryPanel for UI
    
    // New/updated properties for schedule generation and display
    isGeneratingSchedule: isGeneratingScheduleLocal, // Local loading state for UI
    itinerary, // From useScheduleManagement
    selectedItineraryDay: selectedItineraryDayForView, // From useScheduleManagement
    handleSelectItineraryDay: handleScheduleSelectDay, // From useScheduleManagement
    handleGenerateSchedule, // New handler
    handleCloseItinerary, // Updated handler

    // For ItineraryView's startDate prop
    startDate: tripDetailsHook.dates.startDate, 

    // Retained from original structure for LeftPanelContent/other panels
    selectedCategory,
    // showCategoryResultScreen, // Keep if used
    currentPanel,
    isCategoryLoading: categoryResultsHook.isLoading,
    categoryError: categoryResultsHook.error,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton,
    
    // Force refresh (as requested)
    forceRefresh,
    forceRefreshCounter // If needed by consumer
  };
};
