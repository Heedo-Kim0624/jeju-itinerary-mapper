
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary,
    handleCloseItinerary,
    isGeneratingItinerary,
    itineraryReceived,
    categoryResultHandlers,
    currentPanel,
  } = useLeftPanel();

  // Extract callback functions
  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack,
    handleCloseItinerary,
    handleCreateItinerary,
    setRegionSlidePanelOpen: regionSelection.setRegionSlidePanelOpen,
    selectedRegions: regionSelection.selectedRegions,
    setRegionConfirmed: regionSelection.setRegionConfirmed
  });

  // Organize props for child components
  const {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps
  } = useLeftPanelProps({
    uiVisibility,
    currentPanel,
    isGeneratingItinerary,
    itineraryReceived,
    itineraryManagement,
    tripDetails,
    placesManagement,
    categorySelection,
    regionSelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCreateItinerary,
    handleCloseItinerary
  });

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지 (Hook states):", {
      일정생성됨: !!itineraryManagement.itinerary,
      일정패널표시: uiVisibility.showItinerary,
      선택된일자: itineraryManagement.selectedItineraryDay,
      일정길이: itineraryManagement.itinerary ? itineraryManagement.itinerary.length : 0,
      로딩상태: isGeneratingItinerary,
      일정수신완료: itineraryReceived
    });
    
    if (!isGeneratingItinerary && itineraryReceived) {
      console.log("LeftPanel - 로딩 완료 및 일정 수신 완료 (Hook states)");
    }
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    isGeneratingItinerary,
    itineraryReceived,
  ]);
  
  const shouldShowItineraryView = uiVisibility.showItinerary;

  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직 (Hook states):", {
      showItineraryFromHook: uiVisibility.showItinerary,
      isGeneratingPanelState: isGeneratingItinerary,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView
    });
  }, [uiVisibility.showItinerary, isGeneratingItinerary, itineraryManagement.itinerary, shouldShowItineraryView]);

  // If we have itineraryDisplayProps, add the callback for closing the panel
  const enhancedItineraryDisplayProps = itineraryDisplayProps
    ? {
        ...itineraryDisplayProps,
        handleClosePanelWithBackButton: callbacks.handleClosePanelWithBackButton
      }
    : null;

  // If we have mainPanelProps, add the callbacks
  const enhancedMainPanelProps = mainPanelProps
    ? {
        leftPanelContainerProps: {
          ...mainPanelProps.leftPanelContainerProps,
          onCreateItinerary: callbacks.handleCreateItineraryWithLoading
        },
        leftPanelContentProps: {
          ...mainPanelProps.leftPanelContentProps,
          onConfirmCategoryCallbacks: {
            accomodation: (finalKeywords: string[]) => 
              callbacks.handleConfirmCategoryKeywordSelection('숙소', finalKeywords),
            landmark: (finalKeywords: string[]) => 
              callbacks.handleConfirmCategoryKeywordSelection('관광지', finalKeywords),
            restaurant: (finalKeywords: string[]) => 
              callbacks.handleConfirmCategoryKeywordSelection('음식점', finalKeywords),
            cafe: (finalKeywords: string[]) => 
              callbacks.handleConfirmCategoryKeywordSelection('카페', finalKeywords),
          },
          handlePanelBackCallbacks: {
            accomodation: () => callbacks.handlePanelBackByCategory('숙소'),
            landmark: () => callbacks.handlePanelBackByCategory('관광지'),
            restaurant: () => callbacks.handlePanelBackByCategory('음식점'),
            cafe: () => callbacks.handlePanelBackByCategory('카페'),
          },
        }
      }
    : null;

  return (
    <div className="relative h-full">
      <LeftPanelDisplayLogic
        isGenerating={isGeneratingItinerary}
        shouldShowItineraryView={shouldShowItineraryView}
        itineraryDisplayProps={enhancedItineraryDisplayProps}
        mainPanelProps={enhancedMainPanelProps}
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
    </div>
  );
};

export default LeftPanel;
