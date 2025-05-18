import { useState, useCallback, useEffect } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategoryResults } from './use-category-results';
import { ItineraryDay as DomainItineraryDay, Place, SelectedPlace } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
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
  const categorySelection = useCategorySelection();
  const tripDetailsHook = useTripDetails();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);
  
  const { directInputValues, onDirectInputChange } = useInputState();

  const keywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory: (category: CategoryName, finalKeywords: string[], clearSelection: boolean = false) => {
      categorySelection.handleConfirmCategory(category, finalKeywords, clearSelection);
      if (clearSelection) {
        setShowCategoryResult(category);
      }
    }
  };

  const placesManagementHook = useSelectedPlaces();
  const {
    // selectedPlaces, // Destructured below for clarity
    // candidatePlaces, // Destructured below for clarity
    // ... other properties from placesManagementHook
  } = placesManagementHook;

  const allPlacesForSchedule = [...placesManagementHook.selectedPlaces, ...placesManagementHook.candidatePlaces];

  const {
    itinerary,
    selectedDay: scheduleSelectedDay,
    isLoading: isScheduleLoading,
    handleSelectDay: handleScheduleSelectDay,
    runScheduleGenerationProcess,
  } = useScheduleManagement({
    selectedPlaces: allPlacesForSchedule,
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
      
      // 약간의 지연 후 UI 전환 (애니메이션 효과 또는 UI 안정화 시간)
      setTimeout(() => {
        setShowItineraryPanel(true);
        setForceRefreshCounter(prev => prev + 1);
        console.log("[useLeftPanel] Itinerary panel shown after delay:", {
          itineraryLength: itinerary.length,
          selectedDay: scheduleSelectedDay, // Use scheduleSelectedDay from useScheduleManagement
        });
        // 성공 토스트 메시지
        toast.success(`${itinerary.length}일에 대한 일정이 생성되었습니다.`);
      }, 500); // 500ms delay

    } else if (!isScheduleLoading && itinerary && itinerary.length === 0) {
      console.log("[useLeftPanel] Schedule loading finished, but itinerary is empty.");
      // toast.info("일정은 생성되었으나 포함된 장소가 없습니다."); // This toast can be repetitive if already shown by generator
    }
  }, [isScheduleLoading, itinerary, scheduleSelectedDay]); // Added scheduleSelectedDay to dependencies

  // 일정 데이터 변경 감지 추가: 데이터가 있지만 패널이 안 보이는 경우 자동 전환
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !showItineraryPanel && !isGeneratingScheduleLocal) {
      console.log("[useLeftPanel] Itinerary data detected while panel is hidden and not loading. Auto-showing panel.");
      setShowItineraryPanel(true);
      setForceRefreshCounter(prev => prev + 1); // Ensure UI updates
    }
  }, [itinerary, showItineraryPanel, isGeneratingScheduleLocal]);


  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: DomainItineraryDay[], selectedDay: number | null }>;
      console.log("[useLeftPanel] 'itineraryCreated' event received (may be redundant):", customEvent.detail);
      
      if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        // This might conflict with the useEffect above, but acts as a fallback
        if (!showItineraryPanel) setShowItineraryPanel(true);
      } else if (customEvent.detail.itinerary && customEvent.detail.itinerary.length === 0) {
        // toast.info("일정은 생성되었으나 포함된 장소가 없습니다.");
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
  const handleCategorySelect = (categoryName: CategoryName) => {
    categoryHandlers.handleCategorySelect(categoryName, categoryResultsHook.refetch);
    setShowCategoryResult(categoryName);
  };

  const handleCloseCategoryResult = () => categoryHandlers.handleCloseCategoryResult(
    (value: CategoryName | null) => setShowCategoryResult(value)
  );
  const handleConfirmCategoryFromButton = () => {
    if (selectedCategory) {
        categoryHandlers.handleConfirmCategory(selectedCategory as CategoryName);
        setShowCategoryResult(null);
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
    setShowItineraryPanel(false); // Hide current itinerary while new one generates

    try {
      await runScheduleGenerationProcess();
      console.log("[useLeftPanel] Schedule generation process completed (runScheduleGenerationProcess finished).");
      // Success is handled by the useEffect watching isScheduleLoading & itinerary
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
  };

  return {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
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

    selectedCategory,
    currentPanel,
    isCategoryLoading: categoryResultsHook.isLoading,
    categoryError: categoryResultsHook.error,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory: handleConfirmCategoryFromButton,
    
    forceRefresh,
    forceRefreshCounter
  };
};
