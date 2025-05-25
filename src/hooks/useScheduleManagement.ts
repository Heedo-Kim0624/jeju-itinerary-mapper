import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useServerResponseHandler } from '@/hooks/schedule/useServerResponseHandler';
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects';
import { useScheduleGenerationCore } from '@/hooks/schedule/useScheduleGenerationCore';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { type ItineraryDay, type SelectedPlace, type Place, CategoryName } from '@/types/core'; // CategoryName 임포트

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

// 제주국제공항 정보
const JEJU_AIRPORT_TEMPLATE: Omit<SelectedPlace, 'id'> = {
  name: '제주국제공항',
  x: 126.4920, // Longitude
  y: 33.5113,  // Latitude
  category: '관광지' as CategoryName, // '관광지'로 변경
  address: '제주특별자치도 제주시 공항로 2',
  image_url: 'https://ldb-phinf.pstatic.net/20150831_15/1441006911611CNxnQ_JPEG/11570553_0.jpg', // 이미지 URL 추가
  // SelectedPlace에 필요한 나머지 필드들의 기본값 설정
  phone: '064-797-2114',
  description: '제주도의 관문 국제공항',
  rating: 4, // 적절한 평점 설정
  road_address: '제주특별자치도 제주시 공항로 2',
  homepage: 'https://www.airport.co.kr/jeju/main.do',
  isSelected: false, // SelectedPlace 필드
  isCandidate: false, // SelectedPlace 필드
  // operationTimeData, geoNodeId, geoNodeDistance, weight, raw, categoryDetail, reviewCount, naverLink, instaLink, operatingHours 등은 필요에 따라 추가
};

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetime,
  endDatetime
}: ScheduleManagementProps) => {
  const [isManuallyGenerating, setIsManuallyGenerating] = useState(false);
  const { clearMarkersAndUiElements, clearAllRoutes, setServerRoutes, geoJsonNodes } = useMapContext();
  
  const {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { processServerResponse } = useScheduleGenerationCore({
    selectedPlaces,
    startDate: dates?.startDate || new Date(),
    geoJsonNodes: geoJsonNodes || [], 
    setItinerary,
    setSelectedDay,
    setServerRoutes,
    setIsLoadingState,
  });

  const { isListenerRegistered } = useServerResponseHandler({
    onServerResponse: processServerResponse,
    enabled: isManuallyGenerating || isLoadingState
  });

  const combinedIsLoading = isLoadingState || isManuallyGenerating;

  // Run schedule generation process function
  const runScheduleGenerationProcess = useCallback(() => {
    console.log("[useScheduleManagement] Starting schedule generation process");
    
    // Prevent duplicate execution
    if (combinedIsLoading) {
      console.log("[useScheduleManagement] Already generating schedule");
      return;
    }

    // Validate required data
    if (selectedPlaces.length === 0 && !JEJU_AIRPORT_TEMPLATE) { // 공항 정보가 없을 경우 대비
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }

    // Validate date info
    if (!startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }

    // Clear step logs
    console.log("[useScheduleManagement] Starting marker and route cleanup...");
    
    // Clear all markers immediately with direct event
    const clearEvent = new Event("startScheduleGeneration");
    window.dispatchEvent(clearEvent);
    console.log("[useScheduleManagement] startScheduleGeneration event dispatched (marker cleanup)");
    
    // Chain clear operations with short delays to ensure proper sequence
    setTimeout(() => {
      // Clear all routes explicitly
      if (clearAllRoutes) {
        clearAllRoutes();
        console.log("[useScheduleManagement] All routes cleared");
      }
      
      // Clear all markers and UI elements
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
        console.log("[useScheduleManagement] All markers and UI elements cleared");
      }
      
      // Set loading states
      setIsManuallyGenerating(true);
      setIsLoadingState(true);
      console.log("[useScheduleManagement] Loading state set");
      
      // Trigger actual schedule generation with detail
      setTimeout(() => {
        try {
          // 공항 정보를 포함한 장소 목록 생성
          const airportStart: SelectedPlace = { ...JEJU_AIRPORT_TEMPLATE, id: `jeju-airport-start-${Date.now()}` };
          const airportEnd: SelectedPlace = { ...JEJU_AIRPORT_TEMPLATE, id: `jeju-airport-end-${Date.now()}` };

          let placesForGeneration: SelectedPlace[] = selectedPlaces.filter(
            p => !(p.name === JEJU_AIRPORT_TEMPLATE.name && p.x === JEJU_AIRPORT_TEMPLATE.x && p.y === JEJU_AIRPORT_TEMPLATE.y)
          );
          
          // 사용자 선택 장소가 없어도 공항 출발/도착은 기본으로
          if (placesForGeneration.length === 0) {
            placesForGeneration = [airportStart, airportEnd];
          } else {
            placesForGeneration = [airportStart, ...placesForGeneration, airportEnd];
          }
          
          console.log("[useScheduleManagement] Places for generation (with airport):", placesForGeneration.map(p=>p.name));

          const event = new CustomEvent("startScheduleGeneration", {
            detail: {
              selectedPlaces: placesForGeneration, // 공항이 추가된 장소 목록 사용
              startDatetime,
              endDatetime,
            },
          });
          
          console.log("[useScheduleManagement] Detailed schedule generation event dispatched:", {
            selectedPlacesCount: placesForGeneration.length,
            startDatetime,
            endDatetime,
          });
          
          window.dispatchEvent(event);
          
          // Timeout safety net
          setTimeout(() => {
            if (isManuallyGenerating || isLoadingState) {
              console.log("[useScheduleManagement] Schedule generation timed out (30s)");
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
      }, 300);
    }, 100);
    
  }, [
    combinedIsLoading,
    selectedPlaces, // 원본 selectedPlaces는 의존성에 유지
    startDatetime, 
    endDatetime, 
    clearMarkersAndUiElements,
    clearAllRoutes,
    setIsLoadingState,
    // isManuallyGenerating, // useCallback 내부에서 setIsManuallyGenerating 상태를 변경하므로, 의존성에서 제외하거나 주의해야 함
    // isLoadingState      // useCallback 내부에서 setIsLoadingState 상태를 변경하므로, 의존성에서 제외하거나 주의해야 함
  ]);

  // Reset state when server response is processed
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && (isManuallyGenerating || isLoadingState)) { // isLoadingState도 함께 체크
      console.log("[useScheduleManagement] Server response processed, resetting loading states");
      setIsManuallyGenerating(false);
      setIsLoadingState(false); // isLoadingState도 리셋
    }
  }, [itinerary, isManuallyGenerating, isLoadingState, setIsManuallyGenerating, setIsLoadingState]); // 의존성 추가

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess
  };
};
