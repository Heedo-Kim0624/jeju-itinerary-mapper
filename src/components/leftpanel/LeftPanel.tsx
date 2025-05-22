
import React, { useEffect } from 'react';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { useLeftPanelOrchestrator } from '@/hooks/left-panel/useLeftPanelOrchestrator';
import type { CategoryName } from '@/types/core';

// Types for props are now inferred from useLeftPanelOrchestrator's return and sub-prop hooks

const LeftPanel: React.FC = () => {
  const {
    regionSelection, // Used for RegionPanelHandler
    placesManagement, // Used for CategoryResultHandler
    categoryResultHandlers, // Used for CategoryResultHandler
    callbacks, // General callbacks, e.g. for RegionPanelHandler confirm
    categoryHandlers,

    // Overall control and display props from orchestrator
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps, // Fully typed from orchestrator
    enhancedMainPanelProps,       // Fully typed from orchestrator
    devDebugInfoProps,            // Fully typed from orchestrator
    
    // Direct access to uiVisibility for CategoryResultHandler
    uiVisibility
  } = useLeftPanelOrchestrator();

  // Debugging to ensure props are correctly formed
  useEffect(() => {
    console.log("LeftPanel - enhancedMainPanelProps:", enhancedMainPanelProps);
    console.log("LeftPanel - enhancedItineraryDisplayProps:", enhancedItineraryDisplayProps);
  }, [enhancedMainPanelProps, enhancedItineraryDisplayProps]);

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
        onConfirm={callbacks.handleRegionConfirm} 
      />

      <CategoryResultHandler
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={useLeftPanelOrchestrator().categorySelection.selectedKeywordsByCategory}
        onClose={(category: CategoryName) => categoryResultHandlers.handleResultClose(category)}
        onSelectPlace={(place, categoryName) => placesManagement.handleSelectPlace(place, categoryName)}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete}
      />
      
      {devDebugInfoProps && <DevDebugInfo {...devDebugInfoProps} />}
    </div>
  );
};

export default LeftPanel;
