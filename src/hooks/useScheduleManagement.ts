
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useServerResponseHandler } from '@/hooks/schedule/useServerResponseHandler';
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects';
import { useScheduleGenerationCore } from '@/hooks/schedule/useScheduleGenerationCore';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { type ItineraryDay, type SelectedPlace, type Place, CategoryName } from '@/types/core'; 

interface ScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  } | null;
  startDatetime: string | null;
  endDatetime: string | null;
}

// 제주국제공항 정보 - 정확한 데이터로 업데이트
const JEJU_AIRPORT_TEMPLATE: Omit<SelectedPlace, 'id'> = {
  name: '제주국제공항',
  x: 126.49278,  // 정확한 경도 좌표
  y: 33.51135,   // 정확한 위도 좌표
  category: '관광지' as CategoryName, // CategoryName 타입으로 명시적 타입 단언
  address: '제주특별자치도 제주시 공항로 2',
  image_url: 'https://ldb-phinf.pstatic.net/20150831_15/1441006911611CNxnQ_JPEG/11570553_0.jpg',
  phone: '064-797-2114',
  description: '제주도의 관문 국제공항',
  rating: 4,
  road_address: '제주특별자치도 제주시 공항로 2',
  homepage: 'https://www.airport.co.kr/jeju/main.do',
  isSelected: false,
  isCandidate: false,
};

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetime,
  endDatetime
}: ScheduleManagementProps) => {
  const [isManuallyGenerating, setIsManuallyGenerating] = useState(false);
  // clearMarkersAndUiElements from MapContext is expected to clear ALL types of markers
  const { clearMarkersAndUiElements, clearAllRoutes, setServerRoutes, geoJsonNodes } = useMapContext();
  
  const {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay, // setSelectedDay 가져오기
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { processServerResponse } = useScheduleGenerationCore({
    selectedPlaces,
    startDate: dates?.startDate || new Date(),
    geoJsonNodes: geoJsonNodes || [], 
    setItinerary,
    setSelectedDay, // setSelectedDay 전달
    setServerRoutes,
    setIsLoadingState,
  });

  const { isListenerRegistered } = useServerResponseHandler({
    onServerResponse: processServerResponse,
    enabled: isManuallyGenerating || isLoadingState
  });

  const combinedIsLoading = isLoadingState || isManuallyGenerating;

  // 스케줄 생성 프로세스 실행 함수 개선
  const runScheduleGenerationProcess = useCallback(() => {
    console.log("[useScheduleManagement] Starting schedule generation process...");
    
    if (combinedIsLoading) {
      console.log("[useScheduleManagement] Already generating schedule, aborting.");
      toast.info("이미 일정 생성 중입니다.");
      return;
    }

    if (selectedPlaces.length === 0 && !JEJU_AIRPORT_TEMPLATE) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }
    if (!startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }

    console.log("[useScheduleManagement] Clearing existing map elements before generation...");
    // MapContext에서 제공하는 clearAllRoutes와 clearMarkersAndUiElements를 사용
    if (clearAllRoutes) {
      clearAllRoutes();
      console.log("[useScheduleManagement] All routes cleared via MapContext.");
    }
    if (clearMarkersAndUiElements) {
      // 이 함수는 일반 검색 마커(초록색)와 기존 일정 마커 모두를 포함하여 모든 마커와 UI 요소를 지워야 합니다.
      clearMarkersAndUiElements();
      console.log("[useScheduleManagement] All markers and UI elements cleared via MapContext.");
    }
    
    // 'startScheduleGeneration' 이벤트는 여전히 다른 리스너(예: MapMarkers의 useMarkerEventListeners)에 의해 사용될 수 있습니다.
    // 이 이벤트는 MapMarkers가 자체 마커를 정리하도록 유도할 수 있습니다.
    // 하지만, MapContext의 clearMarkersAndUiElements가 이미 MapMarkers의 마커를 포함하여 모든 것을 정리한다면
    // 이 이벤트의 역할이 중복될 수 있습니다. 현재 로직에서는 MapContext의 함수가 우선적으로 사용됩니다.
    const clearEvent = new Event("startScheduleGeneration"); // TODO: 이 이벤트의 필요성 재검토
    window.dispatchEvent(clearEvent);
    console.log("[useScheduleManagement] Dispatched 'startScheduleGeneration' event (for potential legacy listeners).");
    
    setIsManuallyGenerating(true); 
    setIsLoadingState(true); 
    console.log("[useScheduleManagement] Loading states set to true.");
    
    setTimeout(() => {
      try {
        const airportStart: SelectedPlace = { 
          ...JEJU_AIRPORT_TEMPLATE, 
          id: `jeju-airport-start-${Date.now()}` 
        };
        const airportEnd: SelectedPlace = { 
          ...JEJU_AIRPORT_TEMPLATE, 
          id: `jeju-airport-end-${Date.now()}`
        };

        let placesForGeneration: SelectedPlace[] = selectedPlaces.filter(
          p => !(p.name === JEJU_AIRPORT_TEMPLATE.name && 
                Math.abs(p.x - JEJU_AIRPORT_TEMPLATE.x) < 0.001 && 
                Math.abs(p.y - JEJU_AIRPORT_TEMPLATE.y) < 0.001)
        );
        
        if (placesForGeneration.length === 0) {
          placesForGeneration = [airportStart, airportEnd];
        } else {
          placesForGeneration = [airportStart, ...placesForGeneration, airportEnd];
        }
        
        console.log("[useScheduleManagement] Places for generation (with airport):", placesForGeneration.map(p => ({ name: p.name, x: p.x, y: p.y })));

        const event = new CustomEvent("startScheduleGeneration", { 
          detail: {
            selectedPlaces: placesForGeneration,
            startDatetime,
            endDatetime,
            isDataPayloadEvent: true 
          },
        });
        
        console.log("[useScheduleManagement] Detailed schedule generation event dispatched (to backend trigger):", {
          selectedPlacesCount: placesForGeneration.length,
          startDatetime,
          endDatetime,
        });
        window.dispatchEvent(event);
        
        setTimeout(() => {
          if (isManuallyGenerating || isLoadingState) {
            console.warn("[useScheduleManagement] Schedule generation timed out (30s)");
            setIsManuallyGenerating(false);
            setIsLoadingState(false);
            toast.error("개발자가 일정 생성 서버를 열지 않아서 일정 생성이 불가합니다. 상주 인원에게 문의부탁드립니다.");
          }
        }, 30000);
      } catch (error) {
        console.error("[useScheduleManagement] Error dispatching schedule generation event:", error);
        setIsManuallyGenerating(false);
        setIsLoadingState(false);
        toast.error("개발자가 일정 생성 서버를 열지 않아서 일정 생성이 불가합니다. 상주 인원에게 문의부탁드립니다.");
      }
    }, 100); 
    
  }, [
    combinedIsLoading, 
    selectedPlaces,
    startDatetime, 
    endDatetime, 
    clearMarkersAndUiElements, // from MapContext
    clearAllRoutes, // from MapContext
    setIsLoadingState, 
    // geoJsonNodes, // processServerResponse에서 사용되므로 의존성 배열에 추가 고려 (useScheduleGenerationCore 내부에서 사용)
    // setItinerary, // processServerResponse에서 사용
    // setSelectedDay, // processServerResponse에서 사용
    // setServerRoutes, // processServerResponse에서 사용
  ]);

  // 서버 응답 처리 완료 시 상태 리셋
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !isLoadingState && !isManuallyGenerating) {
       console.log("[useScheduleManagement] Itinerary received and loading states are false. Generation process complete.");
    }
  }, [itinerary, isLoadingState, isManuallyGenerating]);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess
  };
};

