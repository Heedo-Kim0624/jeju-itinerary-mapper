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
    // setSelectedDay, // 직접 사용하지 않고 handleSelectDay를 통해
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { processServerResponse } = useScheduleGenerationCore({
    selectedPlaces,
    startDate: dates?.startDate || new Date(),
    geoJsonNodes: geoJsonNodes || [], 
    setItinerary,
    setSelectedDay, // This setSelectedDay is from useScheduleStateAndEffects, used to set the day after generation
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
    if (clearAllRoutes) {
      clearAllRoutes();
      console.log("[useScheduleManagement] All routes cleared.");
    }
    if (clearMarkersAndUiElements) {
      // This should clear general search markers (green ones) AND any existing itinerary markers.
      clearMarkersAndUiElements();
      console.log("[useScheduleManagement] All markers and UI elements cleared.");
    }
    
    // Dispatch 'startScheduleGeneration' for any other listeners that need to reset.
    // MapMarkers' useMarkerEventListeners listens to this.
    const clearEvent = new Event("startScheduleGeneration");
    window.dispatchEvent(clearEvent);
    console.log("[useScheduleManagement] Dispatched 'startScheduleGeneration' event.");
    
    setIsManuallyGenerating(true); // Local loading state for this hook
    setIsLoadingState(true); // Global loading state via useScheduleStateAndEffects
    console.log("[useScheduleManagement] Loading states set to true.");
    
    // 스케줄 생성 트리거 (백엔드 호출 등)
    // setTimeout is used here to ensure state updates propagate and UI reflects loading state
    // before potentially blocking operations or async calls are made.
    setTimeout(() => {
      try {
        // 고유 ID로 공항 장소 생성
        const airportStart: SelectedPlace = { 
          ...JEJU_AIRPORT_TEMPLATE, 
          id: `jeju-airport-start-${Date.now()}` 
        };
        const airportEnd: SelectedPlace = { 
          ...JEJU_AIRPORT_TEMPLATE, 
          id: `jeju-airport-end-${Date.now()}`
        };

        // 이미 공항과 동일한 장소는 필터링
        let placesForGeneration: SelectedPlace[] = selectedPlaces.filter(
          p => !(p.name === JEJU_AIRPORT_TEMPLATE.name && 
                Math.abs(p.x - JEJU_AIRPORT_TEMPLATE.x) < 0.001 && 
                Math.abs(p.y - JEJU_AIRPORT_TEMPLATE.y) < 0.001)
        );
        
        // 사용자 선택 장소가 없어도 공항 출발/도착은 기본으로 포함
        if (placesForGeneration.length === 0) {
          placesForGeneration = [airportStart, airportEnd];
        } else {
          placesForGeneration = [airportStart, ...placesForGeneration, airportEnd];
        }
        
        console.log("[useScheduleManagement] Places for generation (with airport):", placesForGeneration.map(p => ({ name: p.name, x: p.x, y: p.y })));

        const event = new CustomEvent("startScheduleGeneration", { // This event name is overloaded, maybe rename for clarity if it triggers different logic
          detail: {
            selectedPlaces: placesForGeneration,
            startDatetime,
            endDatetime,
            // Add a flag to differentiate this from a simple "clear markers" event if needed
            isDataPayloadEvent: true 
          },
        });
        
        console.log("[useScheduleManagement] Detailed schedule generation event dispatched (to backend trigger):", {
          selectedPlacesCount: placesForGeneration.length,
          startDatetime,
          endDatetime,
        });
        window.dispatchEvent(event);
        
        // Timeout safety net
        setTimeout(() => {
          if (isManuallyGenerating || isLoadingState) {
            console.warn("[useScheduleManagement] Schedule generation timed out (30s)");
            setIsManuallyGenerating(false);
            setIsLoadingState(false);
            toast.error("일정 생성 시간이 초과되었습니다. 다시 시도해주세요.");
          }
        }, 30000);
      } catch (error) {
        console.error("[useScheduleManagement] Error dispatching schedule generation event:", error);
        setIsManuallyGenerating(false);
        setIsLoadingState(false);
        toast.error("일정 생성 요청 중 오류가 발생했습니다.");
      }
    }, 100); // Reduced delay from 300 to 100
    
  }, [
    combinedIsLoading, // Already checks isLoadingState
    selectedPlaces,
    startDatetime, 
    endDatetime, 
    clearMarkersAndUiElements,
    clearAllRoutes,
    setIsLoadingState, // From useScheduleStateAndEffects
    // Removed: isManuallyGenerating (it's part of combinedIsLoading check)
  ]);

  // 서버 응답 처리 완료 시 상태 리셋
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !isLoadingState && !isManuallyGenerating) {
       console.log("[useScheduleManagement] Itinerary received and loading states are false. Generation process complete from this hook's perspective.");
       // No need to set loading to false here if processServerResponse already does it via setIsLoadingState
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
