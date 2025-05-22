
import { useEffect } from 'react'; // useEffect is kept for potential future, minimal logging if uncommented by user
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { useCreateItineraryHandler } from '@/hooks/left-panel/useCreateItineraryHandler';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { useAdaptedScheduleGenerator } from '@/hooks/left-panel/useAdaptedScheduleGenerator';
import { useItineraryViewDecider } from '@/hooks/left-panel/useItineraryViewDecider';
import { useEnhancedPanelProps } from '@/hooks/left-panel/useEnhancedPanelProps';
import { useItineraryCreationTrigger } from './orchestration/useItineraryCreationTrigger'; // New import
// Removed useMapContext as its usage is now encapsulated in useItineraryCreationTrigger
// Removed toast as its usage is now encapsulated in useItineraryCreationTrigger
// Removed summarizeItineraryData as logs using it are removed
// Removed type ItineraryDay, Place, SchedulePayload if not used directly after refactor (to be checked by linter/compiler)
import type { CategoryName } from '@/utils/categoryUtils';

export const useLeftPanelOrchestrator = () => {
  const leftPanelCore = useLeftPanel();
  
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCloseItinerary,
    categoryResultHandlers,
    currentPanel,
    isGeneratingItinerary: isGeneratingFromCoreHook,
  } = leftPanelCore;

  const { runScheduleGeneration: runScheduleGenerationFromRunner, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();
  // const { clearAllRoutes, clearMarkersAndUiElements } = useMapContext(); // Moved to useItineraryCreationTrigger

  const { adaptedRunScheduleGeneration } = useAdaptedScheduleGenerator({
    runScheduleGenerationFromRunner,
    selectedCorePlaces: placesManagement.selectedPlaces,
    candidateCorePlaces: placesManagement.candidatePlaces,
    tripStartDateFromDetails: tripDetails.dates?.startDate || null,
  });

  const {
    createItinerary, // Renamed from createItinerary to avoid conflict if a local var was also named createItinerary
    isCreatingItinerary: isCreatingFromCustomHook,
  } = useCreateItineraryHandler({
    placesManagement: {
        selectedPlaces: placesManagement.selectedPlaces,
        candidatePlaces: placesManagement.candidatePlaces,
        prepareSchedulePayload: placesManagement.prepareSchedulePayload,
    },
    tripDetails: {
      dates: tripDetails.dates,
      startTime: tripDetails.startTime,
      endTime: tripDetails.endTime,
    },
    runScheduleGeneration: adaptedRunScheduleGeneration,
  });
  
  const { shouldShowItineraryView } = useItineraryViewDecider({
    itineraryManagement: {
      showItinerary: itineraryManagement.showItinerary,
      isItineraryCreated: itineraryManagement.isItineraryCreated,
      itinerary: itineraryManagement.itinerary,
    }
  });

  const adaptedPlacesManagementForProps = {
    ...placesManagement,
    handleAutoCompletePlaces: (category: CategoryName, placesFromApi: any[], keywords: string[]) => {
      const travelDays = keywords ? keywords.length : null; 
      placesManagement.handleAutoCompletePlaces(category, placesFromApi, travelDays);
    }
  };

  const isActuallyGenerating = isGeneratingFromCoreHook || isRunnerGenerating || isCreatingFromCustomHook;

  // Use the new hook for triggering itinerary creation
  const { handleTriggerCreateItinerary } = useItineraryCreationTrigger({
    createItineraryFunction: createItinerary,
    isCurrentlyGenerating: isActuallyGenerating,
  });

  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack,
    handleCloseItinerary,
    setRegionSlidePanelOpen: regionSelection.setRegionSlidePanelOpen,
    selectedRegions: regionSelection.selectedRegions,
    setRegionConfirmed: regionSelection.setRegionConfirmed,
    handleCreateItinerary: createItinerary, // Pass the original createItinerary for other callback usages if needed
  });

  const typedCurrentPanel = (
    currentPanel === 'region' || 
    currentPanel === 'date' || 
    currentPanel === 'category' || 
    currentPanel === 'itinerary'
  ) ? currentPanel : 'category' as const;

  const {
    itineraryDisplayProps: baseItineraryDisplayProps,
    mainPanelProps: baseMainPanelProps,
    devDebugInfoProps,
  } = useLeftPanelProps({
    uiVisibility,
    currentPanel: typedCurrentPanel,
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement: itineraryManagement,
    tripDetails,
    placesManagement: adaptedPlacesManagementForProps,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary,
    regionSelection,
    onConfirmCategoryCallbacks: callbacks.onConfirmCategoryCallbacks,
    handlePanelBackCallbacks: callbacks.handlePanelBackCallbacks,
  });

  // Removed useEffect blocks that were commented out and for debugging purposes.
  // This helps in cleaning up the file and reducing its size.

  const {
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
  } = useEnhancedPanelProps({
    itineraryDisplayProps: baseItineraryDisplayProps,
    mainPanelProps: baseMainPanelProps,
    callbacks,
    handleTriggerCreateItinerary, // Pass the new trigger function
  });

  return {
    regionSelection,
    uiVisibility,
    categorySelection,
    placesManagement,
    callbacks,
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
    devDebugInfoProps,
    categoryResultHandlers,
  };
};
