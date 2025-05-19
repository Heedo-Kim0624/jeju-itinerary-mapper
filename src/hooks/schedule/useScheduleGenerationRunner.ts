
import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace, ItineraryDay as CreatorItineraryDay } from '@/types/index'; // ItineraryDay는 index.ts에서 가져옴
import { NewServerScheduleResponse, ServerRouteResponse as MapServerRouteResponse } from '@/types/schedule'; // ServerRouteResponse 이름 변경
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useItineraryCreator } from '@/hooks/use-itinerary-creator'; // ItineraryDay 이름 충돌 피하기 위해 as 사용
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser } from './useScheduleParser'; // updateItineraryWithCoordinates 제거
// import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser'; // 필요시 사용

const DEBUG_MODE = true;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null; // ISO string
  endDatetime: string | null;   // ISO string
  setItinerary: (itinerary: CreatorItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationRunner = ({
  selectedPlaces,
  dates,
  startDatetime, 
  endDatetime,   
  setItinerary,
  setSelectedDay,
  setIsLoadingState,
}: UseScheduleGenerationRunnerProps) => {
  const { generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook();
  const { createItinerary } = useItineraryCreator();
  const { setServerRoutes, geoJsonNodes } = useMapContext(); // geoJsonNodes는 좌표 주입에 사용될 수 있음
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  // useScheduleParser에서 parseServerResponse 대신 parseSchedule 사용
  const { parseSchedule } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess started.");
    setIsLoadingState(true);
    
    let finalItineraryForEvent: CreatorItineraryDay[] = [];
    
    try {
      const payload = preparePayload();
      debugLog('Server request payload (useScheduleGenerationRunner):', payload);
      
      if (!payload || !dates?.startDate) { // dates.startDate도 확인
        toast.error("일정 생성에 필요한 정보가 부족합니다 (날짜 또는 페이로드).");
        setIsLoadingState(false);
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      debugLog('Raw server response (useScheduleGenerationRunner):', serverResponse);
      
      if (serverResponse) {
        console.log('[useScheduleGenerationRunner] 서버 응답이 유효합니다. 일정 파싱을 시작합니다.');
        
        // parseSchedule 호출 시 startDate ISO 문자열 전달
        let parsedItinerary = parseSchedule(serverResponse, dates.startDate.toISOString());
        console.log("[useScheduleGenerationRunner] 파싱된 일정 (좌표 업데이트 전):", JSON.parse(JSON.stringify(parsedItinerary)));
        
        if (parsedItinerary.length === 0) {
          console.error('[useScheduleGenerationRunner] 서버 응답 파싱 결과가 빈 배열입니다.');
          toast.error('서버 응답을 처리할 수 없습니다. 다시 시도해 주세요.');
          // Fallback logic
        } else {
          // TODO: 좌표 주입 로직. MapContext의 geoJsonNodes와 parsedItinerary.places의 geoNodeId를 사용.
          // 이 로직은 별도 함수로 분리하거나 MapContext 내부에 두는 것이 좋음.
          // 예: const itineraryWithCoords = injectCoordinates(parsedItinerary, geoJsonNodes);
          // 지금은 좌표 주입 없이 진행
          const itineraryWithCoords = parsedItinerary; 
          console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정 (현재는 스킵됨):", JSON.parse(JSON.stringify(itineraryWithCoords)));
          
          setItinerary(itineraryWithCoords);
          finalItineraryForEvent = itineraryWithCoords;
          
          const routesForMapContext: Record<number, MapServerRouteResponse> = {};
          itineraryWithCoords.forEach(dayWithCoords => {
            if (dayWithCoords.interleaved_route && dayWithCoords.dayOfWeek && typeof dayWithCoords.totalDistance === 'number') {
                 routesForMapContext[dayWithCoords.day] = {
                    day: dayWithCoords.dayOfWeek, // DailyRouteSummary 'day'는 요일 문자열
                    interleaved_route: dayWithCoords.interleaved_route,
                    status: "성공", // 파싱 성공 시 기본값
                    total_distance_m: dayWithCoords.totalDistance * 1000, // km -> m
                 };
            }
          });
          
          console.log("[useScheduleGenerationRunner] 지도 콘텍스트에 경로 데이터 설정:", routesForMapContext);
          setServerRoutes(routesForMapContext);
          
          if (itineraryWithCoords.length > 0) {
            setSelectedDay(itineraryWithCoords[0].day);
            toast.success(`${itineraryWithCoords.length}일 일정이 성공적으로 생성되었습니다!`);
          }
        }
      } else {
        console.error('[useScheduleGenerationRunner] 서버로부터 응답을 받지 못했습니다.');
        toast.error("서버로부터 응답을 받지 못했습니다. 다시 시도해 주세요.");
        // Fallback logic
      }
    } catch (error) {
      console.error("일정 생성 중 오류 발생 (useScheduleGenerationRunner):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      // Fallback logic
    } finally {
      // ... 기존 finally 블록 로직 ...
      console.log("[useScheduleGenerationRunner] finally 블록 진입. isLoadingState를 false로 설정합니다.");
      
      if (finalItineraryForEvent.length > 0) {
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: finalItineraryForEvent,
            selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null
          } 
        });
        window.dispatchEvent(event);
        
        setTimeout(() => {
          window.dispatchEvent(new Event('forceRerender'));
          const coordsEvent = new CustomEvent('itineraryWithCoordinatesReady', {
            detail: { itinerary: finalItineraryForEvent }
          });
          window.dispatchEvent(coordsEvent);
          setIsLoadingState(false);
        }, 100);
      } else {
        const event = new CustomEvent('itineraryCreated', { detail: { itinerary: [], selectedDay: null } });
        window.dispatchEvent(event);
        setTimeout(() => {
          setIsLoadingState(false);
        }, 100);
      }
    }
  }, [
    preparePayload,
    generateScheduleViaHook,
    parseSchedule, // 변경
    geoJsonNodes,
    selectedPlaces,
    setServerRoutes,
    dates,
    createItinerary,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
