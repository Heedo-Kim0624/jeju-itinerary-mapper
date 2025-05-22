
import { useEffect, useCallback, useMemo } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { toast } from 'sonner';
import { summarizeItineraryData } from '@/utils/debugUtils';
import type { 
  LeftPanelPropsData,
  CategorySelectionState,
  PlacesManagementState,
  TripDetailsState,
  KeywordsAndInputsState,
  CategoryResultHandlersState
} from '@/types/left-panel/index';
import type { CategoryName } from '@/types/core';

export const useLeftPanelOrchestrator = () => {
  const leftPanelCore = useLeftPanel();
  
  const {
    regionSelection,
    categorySelection: categorySelectionFromCore,
    keywordsAndInputs: keywordsAndInputsFromCore,
    placesManagement: placesManagementFromCore,
    tripDetails: tripDetailsFromCore,
    uiVisibility: uiVisibilityFromCore,
    itineraryManagement: itineraryManagementFromCore,
    handleCreateItinerary: initiateItineraryCreation,
    handleCloseItinerary: closeItineraryPanel,
    categoryResultHandlers: categoryResultHandlersFromCore,
    currentPanel,
    isGeneratingItinerary: isGeneratingFromCoreHook,
    categoryHandlers
  } = leftPanelCore;

  // Adapt the interfaces to match the required types
  const tripDetails: TripDetailsState = {
    ...tripDetailsFromCore,
    handleDateChange: tripDetailsFromCore.handleDateChange || ((dates) => {
      if (dates) {
        tripDetailsFromCore.setDates(dates);
      }
    }),
    isDateSet: !!tripDetailsFromCore.dates?.startDate && !!tripDetailsFromCore.dates?.endDate
  };

  const placesManagement: PlacesManagementState = {
    ...placesManagementFromCore,
    // Type-safe adapter for handleSelectPlace
    handleSelectPlace: (place, categoryName: CategoryName) => {
      placesManagementFromCore.handleSelectPlace(place, true, categoryName);
    }
  };

  const categorySelection: CategorySelectionState = {
    ...categorySelectionFromCore,
    categoryStepIndex: categorySelectionFromCore.categoryOrder.findIndex(
      category => category === categorySelectionFromCore.activeMiddlePanelCategory
    ) || 0,
    resetCategorySelection: () => {
      // Implementation for required method
      console.log("Reset category selection");
    },
    setActiveMiddlePanelCategory: (category) => {
      // Use categoryHandlers to change activeMiddlePanelCategory
      if (category === null) {
        categoryHandlers.handleCloseCategoryPanel(categorySelectionFromCore.activeMiddlePanelCategory as CategoryName);
      } else {
        categoryHandlers.handleCategorySelect(category);
      }
    }
  };

  const keywordsAndInputs: KeywordsAndInputsState = {
    directInputValues: {
      '숙소': keywordsAndInputsFromCore.directInputValues.accommodation || '',
      '관광지': keywordsAndInputsFromCore.directInputValues.landmark || '',
      '음식점': keywordsAndInputsFromCore.directInputValues.restaurant || '',
      '카페': keywordsAndInputsFromCore.directInputValues.cafe || ''
    },
    onDirectInputChange: (category, value) => {
      keywordsAndInputsFromCore.onDirectInputChange(category, value);
    }
  };

  const categoryResultHandlers: CategoryResultHandlersState = {
    handleResultClose: categoryResultHandlersFromCore.handleResultClose,
    handleConfirmCategoryWithAutoComplete: async (category: CategoryName, keywords: string[]) => {
      // Adapt to match the expected signature
      await Promise.resolve(categoryResultHandlersFromCore.handleConfirmCategoryWithAutoComplete(
        category, 
        [], // Empty array for placesFromApi
        [] // Empty array for recommendedPlaces
      ));
    }
  };

  const isActuallyGenerating = isGeneratingFromCoreHook;

  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: categorySelectionFromCore.handleConfirmCategory,
    handlePanelBack: categorySelectionFromCore.handlePanelBack,
    handleCloseItinerary: closeItineraryPanel,
    setRegionSlidePanelOpen: regionSelection.setRegionSlidePanelOpen,
    selectedRegions: regionSelection.selectedRegions,
    setRegionConfirmed: regionSelection.setRegionConfirmed,
    handleCreateItinerary: initiateItineraryCreation,
  });

  // Map callbacks for Korean category names
  const onConfirmCategoryCallbacks: Record<CategoryName, (keywords: string[]) => void> = {
    '숙소': callbacks.onConfirmCategoryCallbacks.accomodation,
    '관광지': callbacks.onConfirmCategoryCallbacks.landmark,
    '음식점': callbacks.onConfirmCategoryCallbacks.restaurant,
    '카페': callbacks.onConfirmCategoryCallbacks.cafe
  };

  const handlePanelBackCallbacks: Record<CategoryName, () => void> = {
    '숙소': callbacks.handlePanelBackCallbacks.accomodation,
    '관광지': callbacks.handlePanelBackCallbacks.landmark,
    '음식점': callbacks.handlePanelBackCallbacks.restaurant,
    '카페': callbacks.handlePanelBackCallbacks.cafe
  };

  // Create properly typed leftPanelPropsData
  const leftPanelPropsData: LeftPanelPropsData = {
    uiVisibility: uiVisibilityFromCore,
    currentPanel: currentPanel as 'region' | 'date' | 'category' | 'itinerary',
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagementFromCore.itinerary && 
                        itineraryManagementFromCore.itinerary.length > 0,
    itineraryManagement: itineraryManagementFromCore,
    tripDetails,
    placesManagement,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary: closeItineraryPanel,
    regionSelection,
    onConfirmCategoryCallbacks,
    handlePanelBackCallbacks,
  };

  const {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps,
  } = useLeftPanelProps(leftPanelPropsData);

  useEffect(() => {
    console.log("LeftPanelOrchestrator - 일정 관련 상태 변화 감지:", {
      showItineraryFromHook: uiVisibilityFromCore.showItinerary,
      selectedItineraryDayFromHook: itineraryManagementFromCore.selectedItineraryDay,
      itineraryFromHookSummary: summarizeItineraryData(itineraryManagementFromCore.itinerary),
      isGeneratingState: isActuallyGenerating,
      isItineraryCreatedFromHook: itineraryManagementFromCore.isItineraryCreated,
    });
  }, [
    uiVisibilityFromCore.showItinerary,
    itineraryManagementFromCore.selectedItineraryDay,
    itineraryManagementFromCore.itinerary,
    isActuallyGenerating,
    itineraryManagementFromCore.isItineraryCreated,
  ]);

  const shouldShowItineraryView = useMemo(() => 
    uiVisibilityFromCore.showItinerary &&
    itineraryManagementFromCore.isItineraryCreated &&
    itineraryManagementFromCore.itinerary &&
    itineraryManagementFromCore.itinerary.length > 0,
  [
    uiVisibilityFromCore.showItinerary, 
    itineraryManagementFromCore.isItineraryCreated, 
    itineraryManagementFromCore.itinerary
  ]);

  useEffect(() => {
    console.log("LeftPanelOrchestrator - ItineraryView 표시 결정 로직:", {
      showItineraryFromUiVisibility: uiVisibilityFromCore.showItinerary,
      isItineraryCreatedFromItineraryMgmt: itineraryManagementFromCore.isItineraryCreated,
      isGeneratingState: isActuallyGenerating,
      itineraryExists: !!itineraryManagementFromCore.itinerary,
      itineraryLength: itineraryManagementFromCore.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView,
    });

    if (itineraryManagementFromCore.itinerary && 
        itineraryManagementFromCore.itinerary.length > 0 && 
        itineraryManagementFromCore.itinerary.every(day => day.places.length === 0)) {
      console.warn("LeftPanelOrchestrator - 일정은 있지만 모든 일자에 장소가 없습니다:", 
        summarizeItineraryData(itineraryManagementFromCore.itinerary));
    }
  }, [
    uiVisibilityFromCore.showItinerary,
    itineraryManagementFromCore.isItineraryCreated,
    itineraryManagementFromCore.itinerary,
    isActuallyGenerating,
    shouldShowItineraryView,
  ]);

  const handleTriggerCreateItinerary = useCallback(async () => {
    if (isActuallyGenerating) {
      toast.info("일정 생성 중입니다. 잠시만 기다려주세요.");
      return;
    }
    const success = await initiateItineraryCreation();
    if (success) {
      console.log("[LeftPanelOrchestrator] Itinerary creation process initiated successfully.");
    } else {
      console.log("[LeftPanelOrchestrator] Itinerary creation process failed to initiate or was aborted.");
    }
  }, [isActuallyGenerating, initiateItineraryCreation]);

  const enhancedItineraryDisplayProps = itineraryDisplayProps
    ? {
        ...itineraryDisplayProps,
        handleClosePanelWithBackButton: callbacks.handleClosePanelWithBackButton,
      }
    : null;

  const enhancedMainPanelProps = mainPanelProps
    ? {
        ...mainPanelProps,
        leftPanelContainerProps: {
          ...mainPanelProps.leftPanelContainerProps,
          onCreateItinerary: handleTriggerCreateItinerary,
        },
      }
    : null;

  return {
    regionSelection,
    placesManagement,
    callbacks,
    categoryResultHandlers,
    categoryHandlers,
    
    // Overall control and display props
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
    devDebugInfoProps,
    
    // Direct access for child components
    uiVisibility: uiVisibilityFromCore,
  };
};
