
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import ToggleableSidePanel from './ToggleableSidePanel';
import { useLeftPanelOrchestrator } from '@/hooks/left-panel/useLeftPanelOrchestrator';
import type { CategoryName } from '@/utils/categoryUtils';

const LeftPanel: React.FC = () => {
  const { isMobile } = useIsMobile();
  
  const {
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
  } = useLeftPanelOrchestrator();

  const typedMainPanelProps = enhancedMainPanelProps 
    ? {
        ...enhancedMainPanelProps,
        leftPanelContentProps: {
          ...enhancedMainPanelProps.leftPanelContentProps,
          activeMiddlePanelCategory: enhancedMainPanelProps.leftPanelContentProps.activeMiddlePanelCategory as CategoryName | null
        }
      }
    : null;

  // Mobile layout - responsive split view
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        {/* Top section - LeftPanel content - takes 60% of screen height */}
        <div className="h-[60vh] bg-white border-b border-gray-200 overflow-auto">
          <LeftPanelDisplayLogic
            isGenerating={isActuallyGenerating}
            shouldShowItineraryView={shouldShowItineraryView}
            itineraryDisplayProps={enhancedItineraryDisplayProps}
            mainPanelProps={typedMainPanelProps}
          />
        </div>

        {/* Bottom section - MiddlePanel content - takes 40% of screen height */}
        <div className="h-[40vh] bg-gray-50 overflow-auto">
          <CategoryResultHandler
            showCategoryResult={uiVisibility.showCategoryResult}
            selectedRegions={regionSelection.selectedRegions}
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            onClose={categoryResultHandlers.handleResultClose}
            onSelectPlace={placesManagement.handleSelectPlace}
            selectedPlaces={placesManagement.selectedPlaces}
            onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete}
          />
        </div>

        <RegionPanelHandler
          open={regionSelection.regionSlidePanelOpen}
          onClose={() => regionSelection.setRegionSlidePanelOpen(false)}
          selectedRegions={regionSelection.selectedRegions}
          onToggle={regionSelection.handleRegionToggle}
          onConfirm={callbacks.handleRegionConfirm}
        />
        
        <DevDebugInfo {...devDebugInfoProps} />
      </div>
    );
  }

  // Desktop layout - toggleable side panel
  return (
    <div className="relative h-full">
      <ToggleableSidePanel
        {...(typedMainPanelProps?.leftPanelContainerProps || {})}
      >
        <LeftPanelDisplayLogic
          isGenerating={isActuallyGenerating}
          shouldShowItineraryView={shouldShowItineraryView}
          itineraryDisplayProps={enhancedItineraryDisplayProps}
          mainPanelProps={typedMainPanelProps}
        />
      </ToggleableSidePanel>

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
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={categoryResultHandlers.handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete}
      />
      
      <DevDebugInfo {...devDebugInfoProps} />
    </div>
  );
};

export default LeftPanel;
