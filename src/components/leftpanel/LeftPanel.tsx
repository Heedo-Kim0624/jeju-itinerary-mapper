
import React from 'react';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { useLeftPanelOrchestrator } from '@/hooks/left-panel/useLeftPanelOrchestrator';
// Removed LeftPanelProps as it's complex and better handled by orchestrator's return type

const LeftPanel: React.FC = () => {
  const {
    // Direct states/handlers from orchestrator for specific sub-components
    regionSelection,
    // uiVisibility, // uiVisibility content is used within orchestrator or passed via props objects
    // categorySelection, // categorySelection content is used within orchestrator or passed via props objects
    placesManagement,
    callbacks, // General callbacks for actions like region confirm
    categoryResultHandlers, // For CategoryResultHandler

    // Overall control and display props
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps, // Contains all props for ItineraryDisplayWrapper
    enhancedMainPanelProps,       // Contains all props for MainPanelWrapper
    devDebugInfoProps,            // Contains all props for DevDebugInfo
  } = useLeftPanelOrchestrator();

  // enhancedMainPanelProps contains:
  // - leftPanelContainerProps (for LeftPanelContainer)
  //   - Including onCreateItinerary, selectedPlaces, onRemovePlace, etc.
  // - leftPanelContentProps (for LeftPanelContent)
  //   - Including onDateSelect, onOpenRegionPanel, category navigation props, category panel props, etc.

  // enhancedItineraryDisplayProps contains:
  // - itinerary, startDate, onSelectDay, selectedDay, onCloseItinerary, etc.

  return (
    <div className="relative h-full w-[300px]"> {/* Ensure width is set */}
      <LeftPanelDisplayLogic
        isGenerating={isActuallyGenerating}
        shouldShowItineraryView={shouldShowItineraryView}
        itineraryDisplayProps={enhancedItineraryDisplayProps} // Pass the whole props object
        mainPanelProps={enhancedMainPanelProps}             // Pass the whole props object
      />

      <RegionPanelHandler
        open={regionSelection.regionSlidePanelOpen}
        onClose={() => regionSelection.setRegionSlidePanelOpen(false)}
        selectedRegions={regionSelection.selectedRegions}
        onToggle={regionSelection.handleRegionToggle}
        onConfirm={callbacks.handleRegionConfirm} // from useLeftPanelCallbacks
      />

      <CategoryResultHandler
        // Props for CategoryResultHandler are taken from categoryResultHandlers object
        // and other relevant states from orchestrator if needed.
        showCategoryResult={useLeftPanelOrchestrator().uiVisibility.showCategoryResult} // Example, better to pass from orchestrator if directly needed
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={useLeftPanelOrchestrator().categorySelection.selectedKeywordsByCategory} // Example
        onClose={categoryResultHandlers.handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete}
      />
      
      {devDebugInfoProps && <DevDebugInfo {...devDebugInfoProps} />}
    </div>
  );
};

export default LeftPanel;

