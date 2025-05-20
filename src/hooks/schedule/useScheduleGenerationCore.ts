
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase';
import { NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse } from '@/types/core';
import { useScheduleParser } from './useScheduleParser';

const DEBUG_MODE = true;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

interface ScheduleGenerationCoreProps {
  selectedPlaces: SelectedPlace[];
  startDate: Date;
  geoJsonNodes: Record<string, any>;
  setItinerary: (itinerary: any[]) => void;
  setSelectedDay: (day: number | null) => void;
  setServerRoutes: (routes: Record<number, ServerRouteResponse>) => void;
  setIsLoadingState: (loading: boolean) => void;
}

/**
 * 일정 생성의 핵심 로직을 처리하는 훅
 * 서버 응답 처리와 이벤트 발생을 담당
 */
export const useScheduleGenerationCore = ({
  selectedPlaces,
  startDate,
  geoJsonNodes,
  setItinerary,
  setSelectedDay,
  setServerRoutes,
  setIsLoadingState,
}: ScheduleGenerationCoreProps) => {
  const { parseServerResponse, updateItineraryWithCoordinates } = useScheduleParser({
    currentSelectedPlaces: selectedPlaces
  });

  // 서버 응답을 처리하는 함수
  const processServerResponse = (serverResponse: NewServerScheduleResponse) => {
    try {
      // 서버 응답을 파싱하여 itinerary 생성
      const parsedItinerary = parseServerResponse(serverResponse, startDate);
      console.log("[useScheduleGenerationCore] 파싱된 일정:", parsedItinerary);
      
      if (!parsedItinerary || parsedItinerary.length === 0) {
        console.error("[useScheduleGenerationCore] 파싱된 일정이 비어 있습니다");
        toast.error("서버 응답을 처리할 수 없습니다. 다시 시도해 주세요.");
        
        // 빈 일정 이벤트 발생
        triggerItineraryCreatedEvent([], null);
        return false;
      }
      
      // GeoJSON에서 좌표 정보 추가
      const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes);
      console.log("[useScheduleGenerationCore] 좌표가 추가된 일정:", itineraryWithCoords);
      
      // 상태에 일정 데이터를 저장
      setItinerary(itineraryWithCoords);
      
      // MapContext에 경로 데이터 전달
      const routesForMapContext: Record<number, ServerRouteResponse> = {};
      
      itineraryWithCoords.forEach(dayWithCoords => {
        routesForMapContext[dayWithCoords.day] = {
          nodeIds: dayWithCoords.routeData?.nodeIds || [],
          linkIds: dayWithCoords.routeData?.linkIds || [],
          interleaved_route: dayWithCoords.interleaved_route,
        };
      });
      
      console.log("[useScheduleGenerationCore] MapContext에 전달할 경로 데이터:", routesForMapContext);
      setServerRoutes(routesForMapContext);
      
      // 첫 날짜 선택
      if (itineraryWithCoords.length > 0) {
        setSelectedDay(itineraryWithCoords[0].day);
        
        // 일정 생성 이벤트 발생
        triggerItineraryCreatedEvent(itineraryWithCoords, itineraryWithCoords[0].day);
      }
      
      // 일정 좌표 정보 이벤트 발생
      triggerItineraryWithCoordinatesEvent(itineraryWithCoords);
      
      // 정상 처리 완료
      return true;
    } catch (error) {
      console.error("[useScheduleGenerationCore] 서버 응답 처리 중 오류:", error);
      toast.error("서버 응답 처리 중 오류가 발생했습니다.");
      
      // 오류 이벤트 발생
      triggerItineraryCreatedEvent([], null, true);
      return false;
    }
  };

  // 이벤트 트리거 함수들
  const triggerItineraryCreatedEvent = (
    itinerary: any[], 
    selectedDay: number | null, 
    error = false
  ) => {
    const event = new CustomEvent('itineraryCreated', { 
      detail: { 
        itinerary,
        selectedDay,
        error
      } 
    });
    console.log("[useScheduleGenerationCore] 'itineraryCreated' 이벤트 발생");
    window.dispatchEvent(event);
    
    // 500ms 후에 강제 렌더링 이벤트 발생
    setTimeout(() => {
      window.dispatchEvent(new Event('forceRerender'));
    }, 100);
  };

  const triggerItineraryWithCoordinatesEvent = (itinerary: any[]) => {
    const coordEvent = new CustomEvent('itineraryWithCoordinatesReady', { 
      detail: { itinerary } 
    });
    console.log("[useScheduleGenerationCore] 'itineraryWithCoordinatesReady' 이벤트 발생");
    window.dispatchEvent(coordEvent);
  };

  return {
    processServerResponse,
    triggerItineraryCreatedEvent
  };
};
