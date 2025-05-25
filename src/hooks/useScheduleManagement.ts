
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
  x: 126.4920, // 정확한 경도 좌표
  y: 33.5113,  // 정확한 위도 좌표
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

  // 스케줄 생성 프로세스 실행 함수 개선
  const runScheduleGenerationProcess = useCallback(() => {
    console.log("[useScheduleManagement] Starting schedule generation process");
    
    // 중복 실행 방지
    if (combinedIsLoading) {
      console.log("[useScheduleManagement] Already generating schedule");
      return;
    }

    // 필요한 데이터 검증
    if (selectedPlaces.length === 0 && !JEJU_AIRPORT_TEMPLATE) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }

    // 날짜 정보 검증
    if (!startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }

    // 스텝 로그 초기화
    console.log("[useScheduleManagement] Starting marker and route cleanup...");
    
    // 마커 초기화 이벤트 실행
    const clearEvent = new Event("startScheduleGeneration");
    window.dispatchEvent(clearEvent);
    console.log("[useScheduleManagement] startScheduleGeneration event dispatched (marker cleanup)");
    
    // 단계적으로 초기화 작업 수행
    setTimeout(() => {
      // 모든 경로 명시적 초기화
      if (clearAllRoutes) {
        clearAllRoutes();
        console.log("[useScheduleManagement] All routes cleared");
      }
      
      // 모든 마커와 UI 요소 초기화
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
        console.log("[useScheduleManagement] All markers and UI elements cleared");
      }
      
      // 로딩 상태 설정
      setIsManuallyGenerating(true);
      setIsLoadingState(true);
      console.log("[useScheduleManagement] Loading state set");
      
      // 실제 스케줄 생성 트리거
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
          
          console.log("[useScheduleManagement] Places for generation (with airport):", placesForGeneration.map(p => p.name));

          // 스케줄 생성 이벤트 발생
          const event = new CustomEvent("startScheduleGeneration", {
            detail: {
              selectedPlaces: placesForGeneration,
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
          
          // 타임아웃 안전장치
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
    selectedPlaces,
    startDatetime, 
    endDatetime, 
    clearMarkersAndUiElements,
    clearAllRoutes,
    setIsLoadingState,
  ]);

  // 서버 응답 처리 완료 시 상태 리셋
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && (isManuallyGenerating || isLoadingState)) {
      console.log("[useScheduleManagement] Server response processed, resetting loading states");
      setIsManuallyGenerating(false);
      setIsLoadingState(false);
    }
  }, [itinerary, isManuallyGenerating, isLoadingState]);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess
  };
};
