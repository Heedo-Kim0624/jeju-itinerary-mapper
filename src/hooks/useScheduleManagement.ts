import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useServerResponseHandler } from '@/hooks/schedule/useServerResponseHandler';
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects';
import { useScheduleGenerationCore } from '@/hooks/schedule/useScheduleGenerationCore';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { type ItineraryDay, type SelectedPlace, type Place, CategoryName, NewServerScheduleResponse } from '@/types/core'; 
import { convertTextToMockServerResponse } from '@/utils/manualRouteDataParser'; // 파서 임포트
import { usePlaceContext } from '@/contexts/PlaceContext'; // allPlacesMapByName 접근

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
  // 테스트용 사용자 제공 데이터
  manualLogData?: string; 
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetime,
  endDatetime,
  manualLogData, // prop 추가
}: ScheduleManagementProps) => {
  const [isManuallyGenerating, setIsManuallyGenerating] = useState(false);
  const { clearMarkersAndUiElements, clearAllRoutes, setServerRoutes, geoJsonNodes } = useMapContext();
  const { allPlacesMapByName } = usePlaceContext(); // 장소 정보 가져오기

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
    selectedPlaces, // processServerResponse는 selectedPlaces를 직접 사용하지 않지만, 의존성으로 남겨둘 수 있음
    startDate: dates?.startDate || new Date(),
    geoJsonNodes: geoJsonNodes || [], 
    setItinerary,
    setSelectedDay,
    setServerRoutes,
    setIsLoadingState,
  });

  // useServerResponseHandler는 실제 서버 응답을 위한 것이므로, manualLogData 사용 시에는 직접 호출
  // const { isListenerRegistered } = useServerResponseHandler({
  //   onServerResponse: processServerResponse,
  //   enabled: isManuallyGenerating || isLoadingState
  // });

  const combinedIsLoading = isLoadingState || isManuallyGenerating;

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleManagement] Starting schedule generation process...");
    
    if (combinedIsLoading) {
      console.log("[useScheduleManagement] Already generating schedule, aborting.");
      toast.info("이미 일정 생성 중입니다.");
      return;
    }

    if (!manualLogData && selectedPlaces.length === 0 && !JEJU_AIRPORT_TEMPLATE) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return;
    }
    if (!startDatetime || !endDatetime) {
      toast.error("여행 날짜와 시간 정보가 올바르지 않습니다.");
      return;
    }

    console.log("[useScheduleManagement] Clearing existing map elements before generation...");
    if (clearAllRoutes) clearAllRoutes();
    if (clearMarkersAndUiElements) clearMarkersAndUiElements();
    
    const clearEvent = new Event("startScheduleGeneration");
    window.dispatchEvent(clearEvent);
    
    setIsManuallyGenerating(true); 
    setIsLoadingState(true); // 로딩 상태 시작

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      let serverResponse: NewServerScheduleResponse | null = null;
      if (manualLogData && allPlacesMapByName) {
        console.log("[useScheduleManagement] Using manual log data to generate schedule.");
        serverResponse = convertTextToMockServerResponse(manualLogData, allPlacesMapByName);
        console.log("[useScheduleManagement] Mock server response from manual data:", serverResponse);
      } else {
        // 기존 로직 (실제 API 호출 등) - 현재는 manualLogData 사용에 집중
        // 여기서는 manualLogData가 없으면 에러 처리 또는 기존 API 호출 로직을 넣어야 합니다.
        // 지금은 manualLogData가 있을 때만 동작하도록 합니다.
        toast.warn("수동 로그 데이터가 제공되지 않았습니다. 실제 API 호출 로직이 필요합니다.");
        setIsManuallyGenerating(false);
        setIsLoadingState(false);
        return;
      }

      if (serverResponse) {
        // processServerResponse를 직접 호출
        await processServerResponse(serverResponse); 
        toast.success("수동 데이터를 기반으로 일정이 생성되었습니다!");
      } else {
        toast.error("일정 생성에 실패했습니다 (데이터 처리 오류).");
        setItinerary([]);
      }
    } catch (error) {
      console.error("[useScheduleManagement] Error during manual schedule generation:", error);
      toast.error(`일정 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setItinerary([]);
    } finally {
      setIsManuallyGenerating(false);
      setIsLoadingState(false); // 로딩 상태 종료
    }

  }, [
    combinedIsLoading, 
    selectedPlaces, 
    startDatetime, 
    endDatetime, 
    clearAllRoutes, 
    clearMarkersAndUiElements, 
    setIsLoadingState, 
    setItinerary, 
    manualLogData, 
    processServerResponse,
    allPlacesMapByName // 의존성 추가
  ]);

  // useEffect to auto-run if manualLogData is provided on mount/change
  useEffect(() => {
    if (manualLogData && !combinedIsLoading && itinerary === null) { // itinerary가 null일 때만 (초기 실행)
      console.log("[useScheduleManagement] Manual log data provided, triggering generation process.");
      runScheduleGenerationProcess();
    }
  }, [manualLogData, runScheduleGenerationProcess, combinedIsLoading, itinerary]);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
    // setItinerary, // 외부에서 직접 setItinerary를 호출할 필요는 없을 것 같아 주석 처리
    // setSelectedDay // 외부에서 직접 setSelectedDay를 호출할 필요는 없을 것 같아 주석 처리
  };
};
