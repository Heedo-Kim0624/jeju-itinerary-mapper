import { useState, useCallback, useEffect } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { ItineraryDay as DomainItineraryDay, Place, SelectedPlace } from '@/types/supabase';
import { CategoryName, englishCategoryNameToKorean, koreanToEnglishCategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';
import { useRegionSelection } from './use-region-selection';
import { useCategorySelection } from './use-category-selection';
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers';
import { useInputState } from './left-panel/use-input-state';
import { useScheduleManagement } from './useScheduleManagement';

/**
 * 왼쪽 패널 기능 통합 훅 
 */
export const useLeftPanel = () => {
  const regionSelection = useRegionSelection();
  const categorySelection = useCategorySelection(); // Returns English CategoryName based values
  const tripDetailsHook = useTripDetails();
  
  const [selectedCategoryForConfirmation, setSelectedCategoryForConfirmation] = useState<CategoryName | null>(null); // Stores English CategoryName
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null); // Stores English CategoryName
  
  const { directInputValues, onDirectInputChange } = useInputState(); // Uses English CategoryName keys

  const keywordsAndInputs = {
    directInputValues, // Record<CategoryName (Eng), string>
    onDirectInputChange, // (category: CategoryName (Eng), value: string) => void
    // selectedKeywordsByCategory is from useCategoryKeywords via useCategorySelection, keys are English
    selectedKeywordsByCategory: categorySelection.selectedKeywordsByCategory, 
    toggleKeyword: categorySelection.toggleKeyword, // (category: CategoryName (Eng), keyword: string) => void
    // This function confirms keywords for a category and triggers showing the result panel for it.
    handleConfirmCategory: (category: CategoryName, finalKeywords: string[], clearCurrentKeywords: boolean = false) => {
      // categorySelection.handleConfirmCategory updates keywords and confirmed status
      categorySelection.handleConfirmCategory(category, finalKeywords, clearCurrentKeywords);
      // Always show the result panel for the category whose keywords were just confirmed/cleared.
      setShowCategoryResult(category); 
    }
  };

  const placesManagementHook = useSelectedPlaces();
  const allPlacesForSchedule = [...placesManagementHook.selectedPlaces, ...placesManagementHook.candidatePlaces];

  const {
    itinerary,
    selectedDay: scheduleSelectedDay,
    isLoading: isScheduleLoading,
    handleSelectDay: handleScheduleSelectDay,
    runScheduleGenerationProcess,
  } = useScheduleManagement({
    selectedPlaces: allPlacesForSchedule, // These have CategoryName as English
    dates: tripDetailsHook.dates.startDate && tripDetailsHook.dates.endDate ? { 
      startDate: tripDetailsHook.dates.startDate, 
      endDate: tripDetailsHook.dates.endDate, 
      startTime: tripDetailsHook.dates.startTime, 
      endTime: tripDetailsHook.dates.endTime 
    } : null,
    startDatetime: tripDetailsHook.startDatetime, 
    endDatetime: tripDetailsHook.endDatetime,     
  });

  const [showItineraryPanel, setShowItineraryPanel] = useState<boolean>(false);
  const [isGeneratingScheduleLocal, setIsGeneratingScheduleLocal] = useState<boolean>(false);
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);

  useEffect(() => {
    console.log("[useLeftPanel] Syncing local loading state. isScheduleLoading:", isScheduleLoading, "Current local:", isGeneratingScheduleLocal);
    setIsGeneratingScheduleLocal(isScheduleLoading);

    if (!isScheduleLoading && itinerary && itinerary.length > 0) {
      console.log("[useLeftPanel] Schedule loading finished, itinerary available. Preparing to show panel.", { itineraryLength: itinerary.length, currentShowState: showItineraryPanel});
      
      setTimeout(() => {
        setShowItineraryPanel(true);
        setForceRefreshCounter(prev => prev + 1);
        console.log("[useLeftPanel] Itinerary panel shown after delay:", {
          itineraryLength: itinerary.length,
          selectedDay: scheduleSelectedDay, 
        });
        toast.success(`${itinerary.length}일에 대한 일정이 생성되었습니다.`);
      }, 500); 

    } else if (!isScheduleLoading && itinerary && itinerary.length === 0) {
      console.log("[useLeftPanel] Schedule loading finished, but itinerary is empty.");
    }
  }, [isScheduleLoading, itinerary, scheduleSelectedDay]);

  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !showItineraryPanel && !isGeneratingScheduleLocal) {
      console.log("[useLeftPanel] Itinerary data detected while panel is hidden and not loading. Auto-showing panel.");
      setShowItineraryPanel(true);
      setForceRefreshCounter(prev => prev + 1); 
    }
  }, [itinerary, showItineraryPanel, isGeneratingScheduleLocal]);


  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: DomainItineraryDay[], selectedDay: number | null }>;
      console.log("[useLeftPanel] 'itineraryCreated' event received (may be redundant):", customEvent.detail);
      
      if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        if (!showItineraryPanel) setShowItineraryPanel(true);
      }
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated);
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [showItineraryPanel]);


  const uiVisibility = {
    showItinerary: showItineraryPanel,
    setShowItinerary: setShowItineraryPanel,
    showCategoryResult, // English CategoryName | null
    setShowCategoryResult // Expects English CategoryName | null
  };

  const categoryResultsHook = useCategoryResults(
    showCategoryResult, // English CategoryName | null
    showCategoryResult ? categorySelection.selectedKeywordsByCategory[showCategoryResult] || [] : [], 
    regionSelection.selectedRegions
  );

  const categoryResults = {
    recommendedPlaces: categoryResultsHook.recommendedPlaces || [],
    normalPlaces: categoryResultsHook.normalPlaces || []
  };

  const categoryHandlers = useCategoryHandlers(); // Expects/handles English CategoryName

  const handleCategorySelect = (categoryName: CategoryName) => { // categoryName is English
    categoryHandlers.handleCategorySelect(categoryName, categoryResultsHook.refetch);
    // This sets the category for which results should be shown
    setShowCategoryResult(categoryName); 
    // Also update the active middle panel in categorySelection
    categorySelection.handleCategoryClick(categoryName);
    setSelectedCategoryForConfirmation(categoryName); // Store for confirmation button
  };

  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value)
  );

  // This is for a generic "Confirm Category" button, if one exists outside specific panels
  const handleConfirmCategoryFromButton = () => {
    if (selectedCategoryForConfirmation) { // selectedCategoryForConfirmation is English
        categoryHandlers.handleConfirmCategory(selectedCategoryForConfirmation); // Expects English
        // This might mean keyword selection is done, and we move to next step or close result panel.
        // The original logic was setShowCategoryResult(null).
        // Depending on flow, it could also be keywordsAndInputs.handleConfirmCategory(...)
        setShowCategoryResult(null); // Close the result panel
    } else {
        toast.error("선택된 카테고리가 없습니다.");
    }
  };

  const itineraryHandlersOriginal = useItineraryHandlers();
  
  const handleGenerateSchedule = useCallback(async () => {
    if (!tripDetailsHook.dates.startDate || !tripDetailsHook.dates.endDate) {
      toast.error("여행 날짜를 먼저 선택해주세요.");
      return false;
    }
    if (allPlacesForSchedule.length === 0) {
      toast.error("최소 1개 이상의 장소를 선택해주세요.");
      return false;
    }

    console.log("[useLeftPanel] Schedule generation initiated by user.");
    setIsGeneratingScheduleLocal(true);
    setShowItineraryPanel(false); 

    try {
      await runScheduleGenerationProcess();
      console.log("[useLeftPanel] Schedule generation process completed (runScheduleGenerationProcess finished).");
      return true;
    } catch (error) {
      console.error("[useLeftPanel] Error during schedule generation process:", error);
      toast.error("일정 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsGeneratingScheduleLocal(false);
      return false;
    }
  }, [tripDetailsHook.dates, allPlacesForSchedule, runScheduleGenerationProcess]);
  
  const handleCloseItinerary = useCallback(() => {
    itineraryHandlersOriginal.handleCloseItinerary(setShowItineraryPanel, setCurrentPanel);
  }, [itineraryHandlersOriginal, setCurrentPanel, setShowItineraryPanel]);

  const forceRefresh = useCallback(() => {
    setForceRefreshCounter(prev => prev + 1);
  }, []);

  const selectedItineraryDayForView = scheduleSelectedDay;

  const placesManagement = {
    ...placesManagementHook,
    // Override or add methods if needed, ensuring CategoryName consistency (English)
    // For example, onConfirmCategory in CategoryResultHandler expects English CategoryName.
    // If placesManagementHook.handleConfirmCategory is used, ensure it aligns.
    // The CategoryResultHandler's onConfirmCategory is now wired to this:
    onConfirmCategoryCompletion: (
        category: CategoryName, // English
        selectedCatPlaces: Place[],
        recommendedCatPlaces: Place[]
      ) => {
        placesManagementHook.handleAutoCompletePlaces(
            category, // English
            [...selectedCatPlaces, ...recommendedCatPlaces], // Pool for auto-completion
            tripDetailsHook.tripDuration !== null ? tripDetailsHook.tripDuration + 1 : null
        );
        // After auto-completion, can close the category result panel or move to next step
        setShowCategoryResult(null); 
      }
  };

  return {
    regionSelection,
    categorySelection, // Contains English CategoryName based states/handlers
    keywordsAndInputs, // Contains English CategoryName based states/handlers
    placesManagement,
    tripDetails: tripDetailsHook,
    uiVisibility,
    
    isGeneratingSchedule: isGeneratingScheduleLocal,
    itinerary,
    selectedItineraryDay: selectedItineraryDayForView,
    handleSelectItineraryDay: handleScheduleSelectDay,
    handleGenerateSchedule,
    handleCloseItinerary,

    startDate: tripDetailsHook.dates.startDate, 

    selectedCategory: selectedCategoryForConfirmation, // English CategoryName | null
    currentPanel,
    isCategoryLoading: categoryResultsHook.isLoading,
    categoryError: categoryResultsHook.error,
    categoryResults, // Contains places for the showCategoryResult (English)
    handleCategorySelect, // Expects English CategoryName
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton, // For a generic confirm button
    
    forceRefresh,
    forceRefreshCounter
  };
};
