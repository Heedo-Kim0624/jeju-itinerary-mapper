import React, { useEffect, useState, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { useLeftPanelCallbacks } from '@/hooks/left-panel/use-left-panel-callbacks';
import { useLeftPanelProps } from '@/hooks/left-panel/use-left-panel-props';
import { useScheduleGenerationRunner } from '@/hooks/schedule/useScheduleGenerationRunner';
import { toast } from 'sonner';
import type { SchedulePayload, Place as PlaceType } from '@/types';
import { summarizeItineraryData } from '@/utils/debugUtils';

const LeftPanel: React.FC = () => {
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
  } = useLeftPanel();

  const { runScheduleGeneration, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);

  // Extract callback functions
  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack,
    handleCloseItinerary,
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
    isGeneratingItinerary: isCreatingItinerary,
    itineraryReceived: itineraryManagement.isItineraryCreated && !isCreatingItinerary,
    itineraryManagement,
    tripDetails,
    placesManagement,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary
  });

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지 (Hook states):", {
      isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated,
      showItineraryFromHook: uiVisibility.showItinerary,
      selectedItineraryDayFromHook: itineraryManagement.selectedItineraryDay,
      itineraryFromHookSummary: summarizeItineraryData(itineraryManagement.itinerary),
      isCreatingItineraryPanelState: isCreatingItinerary,
      isRunnerGeneratingState: isRunnerGenerating,
    });
  }, [
    itineraryManagement.isItineraryCreated, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    itineraryManagement.itinerary,
    isCreatingItinerary,
    isRunnerGenerating,
  ]);
  
  const shouldShowItineraryView = uiVisibility.showItinerary && itineraryManagement.isItineraryCreated && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0;

  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직 (Hook states):", {
      showItineraryFromHook: uiVisibility.showItinerary,
      isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated,
      isCreatingItineraryPanelState: isCreatingItinerary,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView
    });
    
    if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && itineraryManagement.itinerary.every(day => day.places.length === 0)) {
      console.warn("LeftPanel - 일정은 있지만 모든 일자에 장소가 없습니다 (useEffect):", summarizeItineraryData(itineraryManagement.itinerary));
    }
  }, [uiVisibility.showItinerary, itineraryManagement.isItineraryCreated, itineraryManagement.itinerary, isCreatingItinerary, shouldShowItineraryView]);

  const handleCreateItineraryNew = useCallback(async () => {
    if (isCreatingItinerary || isRunnerGenerating) {
      toast.info("일정 생성 중입니다. 잠시만 기다려주세요.");
      return;
    }

    if (placesManagement.selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }

    if (!tripDetails.dates?.startDate || !tripDetails.dates?.endDate || !tripDetails.startDatetime || !tripDetails.endDatetime) {
        toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
        return;
    }
    
    setIsCreatingItinerary(true);
    try {
      const selectedCorePlaces = placesManagement.selectedPlaces.map(p => ({
        id: String(p.id),
        name: p.name,
        category: p.category,
        x: p.x,
        y: p.y,
        address: p.address,
        road_address: p.road_address,
        phone: p.phone,
        description: p.description,
        rating: p.rating,
        image_url: p.image_url,
        homepage: p.homepage,
        geoNodeId: p.geoNodeId,
      }));

      const selectedPlaceIds = new Set(selectedCorePlaces.map(p => p.id));
      const candidateCorePlaces = placesManagement.allFetchedPlaces
        .filter(p => !selectedPlaceIds.has(String(p.id)))
        .map(p => ({
          id: String(p.id), name: p.name, category: p.category, x: p.x, y: p.y,
        }));

      const payload: SchedulePayload = {
        selected_places: selectedCorePlaces.map(p => ({ id: p.id, name: p.name })),
        candidate_places: candidateCorePlaces.map(p => ({ id: p.id, name: p.name })),
        start_datetime: tripDetails.startDatetime,
        end_datetime: tripDetails.endDatetime,
      };
      
      console.log("[LeftPanel] 일정 생성 시작, 페이로드:", {
        선택된장소수: payload.selected_places.length,
        후보장소수: payload.candidate_places.length,
        시작일시: payload.start_datetime,
        종료일시: payload.end_datetime,
        여행시작일_파서전달용: tripDetails.dates.startDate.toISOString()
      });
      
      const result = await runScheduleGeneration(payload, selectedCorePlaces, tripDetails.dates.startDate);
      
      console.log("[LeftPanel] handleCreateItineraryNew 완료. 결과 요약:", summarizeItineraryData(result));
      
    } catch (error) {
      console.error("[LeftPanel] 일정 생성 중 오류:", error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없음'}`);
    } finally {
      setIsCreatingItinerary(false);
    }
  }, [
    isCreatingItinerary, 
    isRunnerGenerating, 
    placesManagement.selectedPlaces, 
    placesManagement.allFetchedPlaces,
    tripDetails.dates, 
    tripDetails.startDatetime, 
    tripDetails.endDatetime,
    runScheduleGeneration
  ]);

  const enhancedItineraryDisplayProps = itineraryDisplayProps
    ? {
        ...itineraryDisplayProps,
        handleClosePanelWithBackButton: callbacks.handleClosePanelWithBackButton
      }
    : null;

  const enhancedMainPanelProps = mainPanelProps
    ? {
        leftPanelContainerProps: {
          ...mainPanelProps.leftPanelContainerProps,
          onCreateItinerary: handleCreateItineraryNew
        },
        leftPanelContentProps: mainPanelProps.leftPanelContentProps
      }
    : null;

  return (
    <div className="relative h-full">
      <LeftPanelDisplayLogic
        isGenerating={isCreatingItinerary || isRunnerGenerating}
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
