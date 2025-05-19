
import { useCallback } from 'react';
import { toast } from 'sonner';
import { 
  SelectedPlace, 
  NewServerScheduleResponse, 
  isNewServerScheduleResponse, 
  ServerRouteResponse, 
  ItineraryDay, 
  Place, 
  // RouteData // Not directly used here, but ItineraryDay contains it
} from '@/types';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useItineraryCreator } from '@/hooks/use-itinerary-creator'; 
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser, parseServerResponse, updateItineraryWithCoordinates } from './useScheduleParser'; // Import hook and standalone functions
import { convertToStandardItineraryDay } from '@/utils/type-converters'; // Import the new converter

const DEBUG_MODE = true;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

// mapCreatorItineraryToGlobal is removed as we'll use convertToStandardItineraryDay

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  setItinerary: (itinerary: ItineraryDay[]) => void;
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
  const { createItinerary: originalCreateItinerary } = useItineraryCreator();
  const { setServerRoutes, geoJsonNodes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  // Get enrichParsedResponse from useScheduleParser hook instance
  const { enrichParsedResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });


  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess started. Setting isLoadingState to true.");
    setIsLoadingState(true);
    
    let finalItineraryForEvent: ItineraryDay[] = [];
    let itineraryCreatedSuccessfully = false;
    const tripStartDate = dates?.startDate || new Date();
    
    try {
      const payload = preparePayload();
      debugLog('Server request payload (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log('[useScheduleGenerationRunner] 서버 원본 응답:', serverResponse);
      debugLog('Raw server response (useScheduleGenerationRunner):', serverResponse);
      
      console.log('[useScheduleGenerationRunner] 서버 응답 타입 분석:', {
        응답존재: !!serverResponse,
        객체타입: typeof serverResponse === 'object',
        isNewResponse: serverResponse ? isNewServerScheduleResponse(serverResponse) : false
      });

      if (serverResponse && isNewServerScheduleResponse(serverResponse)) {
        console.log('[useScheduleGenerationRunner] 서버 응답이 유효합니다. 일정 파싱을 시작합니다.');
        
        let parsedItinerary = parseServerResponse(serverResponse, tripStartDate);
        console.log("[useScheduleGenerationRunner] 파싱된 일정 (좌표 업데이트 전):", JSON.parse(JSON.stringify(parsedItinerary)));
        
        if (parsedItinerary.length === 0) {
          console.error('[useScheduleGenerationRunner] 서버 응답 파싱 결과가 빈 배열입니다.');
          // Fallback to client-side generation
        } else {
          const enrichedItinerary = enrichParsedResponse(parsedItinerary);
          console.log("[useScheduleGenerationRunner] 상세 정보가 추가된 일정:", JSON.parse(JSON.stringify(enrichedItinerary)));
          
          const itineraryWithCoords = updateItineraryWithCoordinates(enrichedItinerary, geoJsonNodes as any);
          console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정:", JSON.parse(JSON.stringify(itineraryWithCoords)));
          
          setItinerary(itineraryWithCoords);
          finalItineraryForEvent = itineraryWithCoords;
          
          if (itineraryWithCoords.length > 0) {
            setSelectedDay(itineraryWithCoords[0].day);
            
            const routesForMapContext: Record<number, ServerRouteResponse> = {};
            itineraryWithCoords.forEach(dayWithCoords => {
                routesForMapContext[dayWithCoords.day] = {
                    nodeIds: dayWithCoords.routeData.nodeIds.map(id => Number(id)).filter(num => !isNaN(num)), 
                    linkIds: dayWithCoords.routeData.linkIds.map(id => Number(id)).filter(num => !isNaN(num)),
                    interleaved_route: Array.isArray(dayWithCoords.interleaved_route) 
                        ? dayWithCoords.interleaved_route.map(id => typeof id === 'string' ? Number(id) : id).filter(id => typeof id === 'number' && !isNaN(id)) as number[]
                        : [],
                };
            });
            
            console.log("[useScheduleGenerationRunner] 지도 콘텍스트에 경로 데이터 설정:", routesForMapContext);
            setServerRoutes(routesForMapContext);
            toast.success(`${itineraryWithCoords.length}일 일정이 성공적으로 생성되었습니다!`);
            itineraryCreatedSuccessfully = true;
          }
        }
      }
      
      // Fallback or if server parsing failed but we still want to try client generation
      if (!itineraryCreatedSuccessfully) {
        console.warn('[useScheduleGenerationRunner] 서버 일정 생성 실패 또는 파싱 실패. 클라이언트 대체 일정 생성 시도.');
        if (dates && selectedPlaces.length > 0) {
          const creatorFallbackItineraryRaw = originalCreateItinerary(
            selectedPlaces as Place[], // Cast needed as originalCreateItinerary expects Place[]
            dates.startDate,
            dates.endDate,
            dates.startTime,
            dates.endTime
          );
          // Convert raw fallback to standard ItineraryDay[]
          const mappedFallbackItinerary = convertToStandardItineraryDay(creatorFallbackItineraryRaw, dates.startDate);
          
          if (mappedFallbackItinerary.length > 0) {
            const enrichedFallback = enrichParsedResponse(mappedFallbackItinerary);
            const fallbackWithCoords = updateItineraryWithCoordinates(enrichedFallback, geoJsonNodes as any);

            setItinerary(fallbackWithCoords);
            finalItineraryForEvent = fallbackWithCoords;
            setSelectedDay(fallbackWithCoords[0].day);
            toast.info(serverResponse ? '서버 응답 처리 중 문제 발생. 클라이언트에서 대체 일정을 생성했습니다.' : '클라이언트에서 기본 일정을 생성했습니다.');
            itineraryCreatedSuccessfully = true;
          } else {
            toast.error("대체 일정 생성에도 실패했습니다.");
          }
        } else {
           toast.error(serverResponse ? "서버 응답 처리 중 문제 발생 및 대체 일정 생성 불가." : "일정 생성 실패 및 대체 일정 생성 불가.");
        }
      }
    } catch (error) {
      console.error("일정 생성 중 오류 발생 (useScheduleGenerationRunner):", error);
      toast.error("일정 생성 중 오류가 발생했습니다. 클라이언트 대체 일정 생성 시도.");
      // Try fallback in catch block too
      if (dates && selectedPlaces.length > 0) {
        const creatorFallbackItineraryRaw = originalCreateItinerary(
          selectedPlaces as Place[],
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        const mappedFallbackItinerary = convertToStandardItineraryDay(creatorFallbackItineraryRaw, dates.startDate);
        const enrichedFallback = enrichParsedResponse(mappedFallbackItinerary);
        const fallbackWithCoords = updateItineraryWithCoordinates(enrichedFallback, geoJsonNodes as any);

        if (fallbackWithCoords.length > 0) {
            setItinerary(fallbackWithCoords);
            finalItineraryForEvent = fallbackWithCoords;
            setSelectedDay(fallbackWithCoords[0].day);
            toast.info("오류 발생으로 인해 클라이언트에서 기본 일정을 생성했습니다.");
            itineraryCreatedSuccessfully = true;
        }
      }
    } finally {
      console.log("[useScheduleGenerationRunner] finally 블록 진입.");
      const showItineraryStateForEvent = itineraryCreatedSuccessfully && finalItineraryForEvent.length > 0;

      console.log(`[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생 준비: showItinerary=${showItineraryStateForEvent}`);
      const event = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: finalItineraryForEvent,
          selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null,
          showItinerary: showItineraryStateForEvent
        } 
      });
      window.dispatchEvent(event);
      console.log("[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생 완료.");
      
      setTimeout(() => {
        setIsLoadingState(false);
        console.log("[useScheduleGenerationRunner] isLoadingState를 false로 설정 (지연 후).");
      }, 100);
    }
  }, [
    preparePayload,
    generateScheduleViaHook,
    // parseServerResponse, // Now used directly from import
    enrichParsedResponse, // From useScheduleParser hook
    // updateItineraryWithCoordinates, // Now used directly from import
    geoJsonNodes,
    selectedPlaces,
    setServerRoutes,
    dates,
    originalCreateItinerary, 
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
    // mapCreatorItineraryToGlobal, // Replaced by convertToStandardItineraryDay
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
