
import React from 'react';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import MobileToggleablePanel from './MobileToggleablePanel';
import { useLeftPanelOrchestrator } from '@/hooks/left-panel/useLeftPanelOrchestrator';
import type { CategoryName } from '@/utils/categoryUtils';

const LeftPanel: React.FC = () => {
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

  const panelContent = (
    <>
      <LeftPanelDisplayLogic
        isGenerating={isActuallyGenerating}
        shouldShowItineraryView={shouldShowItineraryView}
        itineraryDisplayProps={enhancedItineraryDisplayProps}
        mainPanelProps={typedMainPanelProps}
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
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={categoryResultHandlers.handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete}
      />
      
      <DevDebugInfo {...devDebugInfoProps} />
    </>
  );

  return (
    <>
      {/* 모바일 버전 */}
      <div className="md:hidden">
        <MobileToggleablePanel>
          {panelContent}
        </MobileToggleablePanel>
      </div>

      {/* 데스크톱 버전 */}
      <div className="hidden md:block relative h-full w-[300px]">
        {panelContent}
      </div>
    </>
  );
};

export default LeftPanel;
