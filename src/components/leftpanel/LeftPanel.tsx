import React from 'react';
import RegionPanelHandler from './RegionPanelHandler';
import MainPanelWrapper from './MainPanelWrapper';
import ItineraryDisplayWrapper from './ItineraryDisplayWrapper';
import CategoryResultHandler from './CategoryResultHandler';
import DevDebugInfo from './DevDebugInfo';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import { Place, SelectedPlace, ItineraryDay, CategoryName as CoreCategoryName } from '@/types/core'; // Use CoreCategoryName

interface LeftPanelProps {
  regionSelection: {
    isRegionConfirmed: boolean;
    selectedRegions: string[];
    setRegionSlidePanelOpen: (open: boolean) => void;
    setRegionConfirmed: (confirmed: boolean) => void;
    setSelectedRegions: (regions: string[]) => void;
  };
  categorySelection: {
    currentCategoryPanel: string | null;
    selectedCategory: CoreCategoryName | null;
    handleCategorySelect: (category: CoreCategoryName) => void;
    handlePanelBack: () => void;
    currentKeywords: string[];
  };
  placesManagement: { // This should align with what useLeftPanelOrchestrator's placesManagement provides
    selectedPlaces: SelectedPlace[];
    candidatePlaces: Place[]; // Or SelectedPlace[] depending on usage
    handleSelectPlace: (place: Place, checked: boolean, category: string) => void; // Add this
    handleRemovePlace: (id: string) => void;
    handleViewOnMap: (place: Place) => void;
    isPlaceSelected: (id: string) => boolean;
    selectedPlacesByCategory: Record<string, SelectedPlace[]>;
    isAccommodationLimitReached: boolean;
    allCategoriesSelected: boolean;
    handleAutoCompletePlaces: (category: CoreCategoryName, recommendedPool: Place[], travelDays: number) => void;
    isCompletingAutoCompletion?: boolean;
    autoCompleteError?: any;
    setSelectedPlaces?: (places: SelectedPlace[]) => void;
    setCandidatePlaces?: (places: Place[]) => void;
    prepareSchedulePayload?: any;
  };
  tripDetails: {
    dates?: {
      startDate: Date | null;
      endDate: Date | null;
    };
    startDatetime?: string | null;
    endDatetime?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  };
  uiVisibility: {
    showItinerary: boolean;
    setShowItinerary: (show: boolean) => void;
    showCategoryResult: CoreCategoryName | null;
    setShowCategoryResult: (category: CoreCategoryName | null) => void;
  };
  itineraryData: ItineraryDay[] | null;
  isActuallyGenerating: boolean;
  callbacks: {
    handleConfirmCategory: (category: CoreCategoryName, keywords: string[]) => void;
    handlePanelBack: (currentPanel: string | null) => void;
    regionConfirmed: (regions: string[]) => void;
    setRegionSlidePanelOpen: (open: boolean) => void;
    handleCreateItinerary: () => void;
    onConfirmCategoryCallbacks: Record<CoreCategoryName, (keywords: string[]) => void>;
    handlePanelBackCallbacks: {
      categoryResult: (category: CoreCategoryName | null) => void;
      categorySelection: () => void;
    };
  };
  devDebugInfoProps?: any;
  categoryResultHandlers: {
    categoryPlaces: Record<CoreCategoryName, Place[]>;
    isCategoryLoading: Record<CoreCategoryName, boolean>;
    categoryError: Record<CoreCategoryName, any>;
  };
  currentPanel: string | null;
  onConfirmCategory: (category: CoreCategoryName, keywords: string[]) => void;
  onPanelBack: (currentPanel: string | null) => void;
  isGeneratingItinerary: boolean;
  onCreateItinerary: () => void;
  onItineraryClose: () => void;
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectItineraryDay: (day: number) => void;
  showRegionSlidePanel: boolean;
  onCloseRegionSlidePanel: () => void;
  onConfirmRegion: (regions: string[]) => void;
  initialSelectedRegions: string[];
  selectedDayForDisplay: number | null;
  handleDaySelect: (day: number) => void;
  handleCloseItineraryPanel: () => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  regionSelection,
  categorySelection,
  placesManagement,
  tripDetails,
  uiVisibility,
  itineraryData,
  isActuallyGenerating,
  callbacks,
  shouldShowItineraryView,
  enhancedItineraryDisplayProps,
  enhancedMainPanelProps,
  devDebugInfoProps,
  categoryResultHandlers,
  selectedDayForDisplay,
  handleDaySelect,
  handleCloseItineraryPanel,
}) => {

  const currentPanelDisplay = uiVisibility.showItinerary && itineraryData && itineraryData.length > 0
    ? 'itinerary'
    : uiVisibility.showCategoryResult
      ? 'categoryResult'
      : regionSelection.isRegionConfirmed
        ? 'categorySelection'
        : 'regionSelection';


  const handlePanelBack = () => {
    if (currentPanelDisplay === 'categoryResult') {
      const catToPass = categorySelection.selectedCategory ? categorySelection.selectedCategory : null;
      callbacks.handlePanelBackCallbacks.categoryResult(catToPass as CoreCategoryName);
    } else if (currentPanelDisplay === 'categorySelection') {
      callbacks.handlePanelBackCallbacks.categorySelection();
    } else if (currentPanelDisplay === 'itinerary') {
        if (handleCloseItineraryPanel) handleCloseItineraryPanel();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-lg w-96">
      <LeftPanelDisplayLogic
        currentPanel={currentPanelDisplay}
        regionPanelHandlerProps={{
            isPanelOpen: !regionSelection.isRegionConfirmed && !uiVisibility.showCategoryResult && !uiVisibility.showItinerary,
            onClose: () => callbacks.setRegionSlidePanelOpen(false),
            onConfirm: callbacks.regionConfirmed,
            selectedRegions: regionSelection.selectedRegions,
            setSelectedRegions: regionSelection.setSelectedRegions,
        }}
        mainPanelWrapperProps={enhancedMainPanelProps ? {
            ...enhancedMainPanelProps,
            leftPanelContainerProps: {
                ...enhancedMainPanelProps.leftPanelContainerProps,
                selectedCategory: categorySelection.selectedCategory as CoreCategoryName | null,
                currentKeywords: categorySelection.currentKeywords,
                isGeneratingItinerary: isActuallyGenerating,
                onConfirmCategory: (category, keywords) => {
                    if (callbacks.onConfirmCategoryCallbacks && callbacks.onConfirmCategoryCallbacks[category as CoreCategoryName]) {
                        callbacks.onConfirmCategoryCallbacks[category as CoreCategoryName](keywords);
                    }
                },
                onPanelBack: handlePanelBack,
                placesManagement: {
                    ...placesManagement,
                    selectedPlaces: placesManagement.selectedPlaces || [],
                    allCategoriesSelected: placesManagement.allCategoriesSelected || false,
                },
                tripDetails,
            }
        } : undefined}
        itineraryDisplayWrapperProps={shouldShowItineraryView && enhancedItineraryDisplayProps ? {
            ...enhancedItineraryDisplayProps,
            itinerary: itineraryData || [],
            selectedDay: selectedDayForDisplay,
            onSelectDay: handleDaySelect,
            onClose: handleCloseItineraryPanel,
            isLoading: isActuallyGenerating,
        }: undefined}
        categoryResultHandlerProps={ currentPanelDisplay === 'categoryResult' && uiVisibility.showCategoryResult ? {
            category: uiVisibility.showCategoryResult as CoreCategoryName,
            places: categoryResultHandlers.categoryPlaces[uiVisibility.showCategoryResult as CoreCategoryName] || [],
            isLoading: categoryResultHandlers.isCategoryLoading[uiVisibility.showCategoryResult as CoreCategoryName] || false,
            error: categoryResultHandlers.categoryError[uiVisibility.showCategoryResult as CoreCategoryName] || null,
            onSelectPlace: (place, checked) => placesManagement.handleSelectPlace(place, checked, uiVisibility.showCategoryResult as CoreCategoryName),
            isPlaceSelected: placesManagement.isPlaceSelected,
            onBack: () => handlePanelBack(),
            selectedPlaces: placesManagement.selectedPlaces,
        } : undefined}
        devDebugInfoProps={devDebugInfoProps}
      />
    </div>
  );
};

export default LeftPanel;
