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
import type { SchedulePayload, Place, SelectedPlace as CoreSelectedPlace } from '@/types';
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
    isGeneratingItinerary: isCreatingItinerary || isRunnerGenerating, // Combine loading states
    itineraryReceived: itineraryManagement.itinerary !== null && itineraryManagement.itinerary.length > 0,
    itineraryManagement: {
      ...itineraryManagement,
      isItineraryCreated: itineraryManagement.isItineraryCreated // 실제 isItineraryCreated 사용
    },
    tripDetails,
    placesManagement,
    categorySelection,
    keywordsAndInputs,
    categoryResultHandlers,
    handleCloseItinerary,
    regionSelection
  });

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지 (Hook states):", {
      showItineraryFromHook: uiVisibility.showItinerary,
      selectedItineraryDayFromHook: itineraryManagement.selectedItineraryDay,
      itineraryFromHookSummary: summarizeItineraryData(itineraryManagement.itinerary),
      isCreatingItineraryPanelState: isCreatingItinerary,
      isRunnerGeneratingState: isRunnerGenerating,
      isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated, // 추가된 로그
    });
  }, [
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    itineraryManagement.itinerary,
    isCreatingItinerary,
    isRunnerGenerating,
    itineraryManagement.isItineraryCreated, // 의존성 배열에 추가
  ]);
  
  const shouldShowItineraryView = uiVisibility.showItinerary && 
    itineraryManagement.isItineraryCreated && // isItineraryCreated 조건 추가
    itineraryManagement.itinerary && 
    itineraryManagement.itinerary.length > 0;

  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직 (Hook states):", {
      showItineraryFromHook: uiVisibility.showItinerary,
      isItineraryCreatedFromHook: itineraryManagement.isItineraryCreated, // 추가된 로그
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
      // placesManagement.selectedPlaces는 이미 SelectedPlace[] 타입입니다.
      // CoreSelectedPlace는 SelectedPlace의 별칭이므로, isSelected와 isCandidate를 포함해야 합니다.
      // map 함수에서 이 속성들을 명시적으로 복사합니다.
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
        isSelected: p.isSelected, // isSelected 속성 복사
        isCandidate: p.isCandidate, // isCandidate 속성 복사
        // SelectedPlace에만 있고 Place에는 없는 다른 속성이 있다면 여기에 추가
        // 예: operationTimeData, isRecommended, weight, raw, categoryDetail, reviewCount, naverLink, instaLink, operatingHours 등
        // 해당 속성들이 p에 존재하고 CoreSelectedPlace 타입에 필요하다면 복사합니다.
        // 현재 CoreSelectedPlace (SelectedPlace)는 isSelected, isCandidate 외에는 Place와 동일하므로 이 두 가지만 필수입니다.
      }));

      const selectedPlaceIds = new Set(selectedCorePlaces.map(p => p.id));
      // candidatePlaces는 Place[] 타입이므로 CoreSelectedPlace로 변환 시 isSelected, isCandidate를 추가해야 합니다.
      // API 페이로드에는 isSelected/isCandidate가 필요 없을 수 있으므로 SchedulePlace 타입으로 변환합니다.
      const candidateSchedulePlaces = placesManagement.candidatePlaces
        .filter(p => !selectedPlaceIds.has(String(p.id)))
        .map(p => ({ 
          id: String(p.id), // API는 string ID를 기대할 수 있음
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
      const result = await runScheduleGeneration(payload, selectedCorePlaces, tripDetails.dates.startDate);
      
      console.log("[LeftPanel] handleCreateItineraryNew 완료. 결과 요약:", summarizeItineraryData(result));
      
      // itineraryManagement.handleServerItineraryResponse는 runScheduleGeneration 내부에서 호출되므로 여기서 직접 호출할 필요가 없을 수 있습니다.
      // 만약 runScheduleGeneration이 최종 일정을 반환하고, 여기서 UI 업데이트를 트리거해야 한다면,
      // itineraryManagement.handleServerItineraryResponse(result); 와 같이 호출합니다.
      // 현재 구조에서는 runScheduleGeneration 내부에서 useItinerary().handleServerItineraryResponse를 호출합니다.

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
    placesManagement.candidatePlaces,
    tripDetails.dates, 
    tripDetails.startDatetime, 
    tripDetails.endDatetime,
    runScheduleGeneration,
    // itineraryManagement // 의존성 배열에서 제거 또는 필요한 특정 함수만 추가
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
          onCreateItinerary: () => { // 이 함수는 void를 반환해야 합니다.
            handleCreateItineraryNew();
            // void 반환이므로 return 문 불필요
          }
        },
        leftPanelContentProps: mainPanelProps.leftPanelContentProps
      }
    : null;

  return (
    <div className="relative h-full">
      <LeftPanelDisplayLogic
        isGenerating={isCreatingItinerary || isRunnerGenerating} // 통합된 로딩 상태 사용
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
