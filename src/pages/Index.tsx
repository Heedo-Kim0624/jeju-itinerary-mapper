import React from 'react';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useLeftPanelOrchestrator } from '@/hooks/left-panel/useLeftPanelOrchestrator';
import RightPanel from '@/components/rightpanel/RightPanel'; // Correct import
import LeftPanel from '@/components/leftpanel/LeftPanel'; // Correct import
import { MapProvider } from '@/components/rightpanel/MapContext'; // Correct import

const Index = () => {
  const {
    regionSelection,
    uiVisibility,
    categorySelection,
    placesManagement, // This should now correctly include allCategoriesSelected
    callbacks,
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
    devDebugInfoProps,
    categoryResultHandlers,
    itineraryData, // from orchestrator
    selectedDayForDisplay, // from orchestrator
    handleDaySelect, // from orchestrator
    handleCloseItineraryPanel, // from orchestrator
  } = useLeftPanelOrchestrator();
  
  const { tripDetails } = useTripDetails(); // Already used by orchestrator but might be needed directly

  const leftPanelProps = {
    regionSelection,
    categorySelection,
    placesManagement, // Pass the whole object
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
    // Explicitly pass props needed by LeftPanel that might not be in the spread objects
    currentPanel: uiVisibility.showItinerary && itineraryData && itineraryData.length > 0
      ? 'itinerary'
      : uiVisibility.showCategoryResult
        ? 'categoryResult'
        : regionSelection.isRegionConfirmed
          ? 'categorySelection'
          : 'regionSelection',
    onConfirmCategory: (category, keywords) => {
        if (callbacks.onConfirmCategoryCallbacks && callbacks.onConfirmCategoryCallbacks[category]) {
            callbacks.onConfirmCategoryCallbacks[category](keywords);
        }
    },
    onPanelBack: (currentPanel) => { /* Logic to determine which back callback to call */
        if (currentPanel === 'categoryResult' && categorySelection.selectedCategory) {
            callbacks.handlePanelBackCallbacks.categoryResult(categorySelection.selectedCategory);
        } else if (currentPanel === 'categorySelection') {
            callbacks.handlePanelBackCallbacks.categorySelection();
        } else if (currentPanel === 'itinerary') {
            if (handleCloseItineraryPanel) handleCloseItineraryPanel();
        }
    },
    onCreateItinerary: callbacks.handleCreateItinerary,
    onItineraryClose: handleCloseItineraryPanel,
    itinerary: itineraryData,
    selectedItineraryDay: selectedDayForDisplay,
    onSelectItineraryDay: handleDaySelect,
    showRegionSlidePanel: !regionSelection.isRegionConfirmed && !uiVisibility.showCategoryResult && !uiVisibility.showItinerary,
    onCloseRegionSlidePanel: () => callbacks.setRegionSlidePanelOpen(false),
    onConfirmRegion: callbacks.regionConfirmed,
    initialSelectedRegions: regionSelection.selectedRegions,
  };

  return (
    <MapProvider>
      <div className="flex h-screen overflow-hidden">
        <LeftPanel {...leftPanelProps} />
        <RightPanel 
            selectedPlaces={placesManagement.selectedPlaces}
            itinerary={itineraryData}
            selectedDay={selectedDayForDisplay}
            onPlaceClick={(place, index) => {
                console.log("Map marker clicked in Index page:", place, index);
                // Potentially update selectedPlace in a shared state if needed for info window
            }}
            highlightPlaceId={null} // Add logic for highlightPlaceId if needed
        />
      </div>
    </MapProvider>
  );
};

export default Index;
