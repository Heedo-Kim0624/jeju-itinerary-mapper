
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
import type { SchedulePayload, Place, SelectedPlace as CoreSelectedPlace, ItineraryDay } from '@/types'; // ItineraryDay 추가
import { summarizeItineraryData } from '@/utils/debugUtils';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement, // This now includes isItineraryCreated, showItinerary, etc.
    handleCloseItinerary, // This is from itineraryCreation.handleCloseItineraryPanel
    categoryResultHandlers,
    currentPanel,
    isGeneratingItinerary: isGeneratingFromHook, // Renamed for clarity
  } = useLeftPanel();

  const { runScheduleGeneration, isGenerating: isRunnerGenerating } = useScheduleGenerationRunner();
  const [isCreatingItineraryUiLock, setIsCreatingItineraryUiLock] = useState(false); // UI specific loading lock

  // Combined loading state
  const isActuallyGenerating = isGeneratingFromHook || isRunnerGenerating || isCreatingItineraryUiLock;

  // Extract callback functions
  const callbacks = useLeftPanelCallbacks({
    handleConfirmCategory: keywordsAndInputs.handleConfirmCategory,
    handlePanelBack: categorySelection.handlePanelBack, // This is the simple one for the hook
    handleCloseItinerary, // Passed through
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
    isGeneratingItinerary: isActuallyGenerating,
    itineraryReceived: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
    itineraryManagement: itineraryManagement, // Pass the whole object from useLeftPanel
    tripDetails,
    placesManagement,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary, // This is the top-level one from useLeftPanel
    regionSelection,
    // Pass the structured callbacks for MainPanelContent
    onConfirmCategoryCallbacks: callbacks.onConfirmCategoryCallbacks,
    handlePanelBackCallbacks: callbacks.handlePanelBackCallbacks,
  });

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지 (Hook states):", {
      showItineraryFromHook: uiVisibility.showItinerary, // or itineraryManagement.showItinerary
      selectedItineraryDayFromHook: itineraryManagement.selectedItineraryDay,
      itineraryFromHookSummary: summarizeItineraryData(itineraryManagement.itinerary),
      isCreatingItineraryPanelState: isCreatingItineraryUiLock,
      isRunnerGeneratingState: isRunnerGenerating,
      isGeneratingFromCoreHook: isGeneratingFromHook,
      isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated,
    });
  }, [
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    itineraryManagement.itinerary,
    isCreatingItineraryUiLock,
    isRunnerGenerating,
    isGeneratingFromHook,
    itineraryManagement.isItineraryCreated,
  ]);
  
  const shouldShowItineraryView = 
    itineraryManagement.showItinerary && // Use showItinerary from itineraryManagement
    itineraryManagement.isItineraryCreated && 
    itineraryManagement.itinerary && 
    itineraryManagement.itinerary.length > 0;

  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직 (Hook states):", {
      showItineraryFromItineraryMgmt: itineraryManagement.showItinerary,
      isItineraryCreatedFromItineraryMgmt: itineraryManagement.isItineraryCreated,
      isCreatingItineraryPanelState: isCreatingItineraryUiLock,
      isRunnerGeneratingState: isRunnerGenerating,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView
    });
    
    if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && itineraryManagement.itinerary.every(day => day.places.length === 0)) {
      console.warn("LeftPanel - 일정은 있지만 모든 일자에 장소가 없습니다 (useEffect):", summarizeItineraryData(itineraryManagement.itinerary));
    }
  }, [
      itineraryManagement.showItinerary, 
      itineraryManagement.isItineraryCreated, 
      itineraryManagement.itinerary, 
      isCreatingItineraryUiLock, 
      isRunnerGenerating,
      shouldShowItineraryView
    ]);

  const handleCreateItineraryNew = useCallback(async () => {
    if (isActuallyGenerating) {
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
    
    setIsCreatingItineraryUiLock(true);
    try {
      const selectedCorePlaces: CoreSelectedPlace[] = placesManagement.selectedPlaces.map(p => ({
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
        isSelected: p.isSelected !== undefined ? p.isSelected : true, // Ensure isSelected exists
        isCandidate: p.isCandidate !== undefined ? p.isCandidate : false, // Ensure isCandidate exists
      }));

      const selectedPlaceIds = new Set(selectedCorePlaces.map(p => p.id));
      const candidateSchedulePlaces = placesManagement.candidatePlaces
        .filter(p => !selectedPlaceIds.has(String(p.id)))
        .map(p => ({ 
          id: String(p.id),
          name: p.name 
        }));

      const payload: SchedulePayload = {
        selected_places: selectedCorePlaces.map(p => ({ id: String(p.id), name: p.name })),
        candidate_places: candidateSchedulePlaces,
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
      
      // selectedCorePlaces를 전달합니다. 이 타입은 CoreSelectedPlace[] (즉, SelectedPlace[])입니다.
      // runScheduleGeneration의 두 번째 인자는 CoreSelectedPlace[] 타입의 selectedPlaces를 기대합니다.
      // 세 번째 인자는 Date 타입의 tripStartDate를 기대합니다.
      const result: ItineraryDay[] | null = await runScheduleGeneration(
        payload, 
        selectedCorePlaces, 
        tripDetails.dates.startDate
      );
      
      if (result) {
        console.log("[LeftPanel] handleCreateItineraryNew 완료. 결과 요약:", summarizeItineraryData(result));
        // itineraryManagement.handleServerItineraryResponse는 runScheduleGeneration 내부에서 호출되어
        // useItinerary 훅의 상태를 업데이트하고, 그 결과가 itineraryManagement.itinerary 등으로 반영됩니다.
        // 여기서 직접 UI 상태를 조작하기보다는, 훅의 상태 변화를 통해 UI가 반응하도록 하는 것이 좋습니다.
      } else {
        console.warn("[LeftPanel] handleCreateItineraryNew: runScheduleGeneration returned null or empty.");
        // 오류 토스트는 runScheduleGeneration 또는 그 내부에서 처리될 것으로 예상됩니다.
      }

    } catch (error) {
      console.error("[LeftPanel] 일정 생성 중 오류:", error);
      toast.error(`일정 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없음'}`);
    } finally {
      setIsCreatingItineraryUiLock(false);
    }
  }, [
    isActuallyGenerating, 
    placesManagement.selectedPlaces, 
    placesManagement.candidatePlaces,
    tripDetails.dates, 
    tripDetails.startDatetime, 
    tripDetails.endDatetime,
    runScheduleGeneration,
    // itineraryManagement.handleServerItineraryResponse // This is implicitly handled by runScheduleGeneration -> useItinerary
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
          // onCreateItinerary는 LeftPanelContainerPassedProps에 정의되어 있어야 합니다.
          // useLeftPanelProps에서 leftPanelContainerProps 생성 시 onCreateItinerary를 직접 할당하지 않으므로,
          // LeftPanel.tsx에서 enhancedMainPanelProps를 만들 때 추가합니다.
          onCreateItinerary: handleCreateItineraryNew 
        },
        leftPanelContentProps: mainPanelProps.leftPanelContentProps // This should now be correctly typed
      }
    : null;


  return (
    <div className="relative h-full">
      <LeftPanelDisplayLogic
        isGenerating={isActuallyGenerating}
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
