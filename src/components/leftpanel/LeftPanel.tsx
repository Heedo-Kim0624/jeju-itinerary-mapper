
import React from 'react';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { useLeftPanelOrchestrator } from '@/hooks/left-panel/useLeftPanelOrchestrator';
// Types for props are now inferred from useLeftPanelOrchestrator's return and sub-prop hooks

const LeftPanel: React.FC = () => {
  const {
    regionSelection, // Used for RegionPanelHandler
    placesManagement, // Used for CategoryResultHandler
    categoryResultHandlers, // Used for CategoryResultHandler
    callbacks, // General callbacks, e.g. for RegionPanelHandler confirm

    // Overall control and display props from orchestrator
    isActuallyGenerating,
    shouldShowItineraryView,
    enhancedItineraryDisplayProps, // Fully typed from orchestrator
    enhancedMainPanelProps,       // Fully typed from orchestrator
    devDebugInfoProps,            // Fully typed from orchestrator
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
        // Pass necessary props; showCategoryResult is part of uiVisibility, managed internally by orchestrator/props hooks
        // The component itself will get category from orchestrator via devDebugInfoProps or similar if needed, or its own logic
        showCategoryResult={useLeftPanelOrchestrator().devDebugInfoProps?.showCategoryResult} // This is a bit of a hack, showCategoryResult is tricky
                                                                                            // Better: orchestrator should provide showCategoryResult if needed by direct children
                                                                                            // For now, CategoryResultHandler will use its own 'showCategoryResult' prop
                                                                                            // which it gets from the orchestrator's state.
        // The props for CategoryResultHandler should be explicitly passed if they are not coming from a context
        // Or, the `categoryResultHandlers` object from orchestrator contains the handlers.
        // The `showCategoryResult` state itself might be better managed by `useLeftPanel().uiVisibility.showCategoryResult`
        // Let's assume `uiVisibility.showCategoryResult` is the source of truth
        showCategoryResult={useLeftPanelOrchestrator().uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        // selectedKeywordsByCategory is part of categorySelection, which placesManagement might access or orchestrator provides
        selectedKeywordsByCategory={useLeftPanelOrchestrator().categorySelection.selectedKeywordsByCategory}
        onClose={categoryResultHandlers.handleResultClose} // This now expects (category: CategoryName) => void
        onSelectPlace={placesManagement.handleSelectPlace} // This expects (place: Place, categoryName: CategoryName) => void
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete} // This is (category, keywords)
      />
      
      {devDebugInfoProps && <DevDebugInfo {...devDebugInfoProps} />}
    </div>
  );
};

export default LeftPanel;
