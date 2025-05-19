
import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace, NewServerScheduleResponse, isNewServerScheduleResponse, ServerRouteResponse, ItineraryDay as CreatorItineraryDay } from '@/types'; // Updated imports
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
// ItineraryDay from use-itinerary-creator is CreatorItineraryDay
import { useItineraryCreator } from '@/hooks/use-itinerary-creator'; 
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser, updateItineraryWithCoordinates } from './useScheduleParser';
// extractAllNodesFromRoute and extractAllLinksFromRoute are not used here, consider removing if not needed elsewhere
// import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

const DEBUG_MODE = true;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  setItinerary: (itinerary: CreatorItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
  // Add setShowItinerary if it's managed by the caller of this hook
  // For now, assuming it's handled through events or by useItinerary hook directly
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
  const { setServerRoutes, geoJsonNodes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess started. Setting isLoadingState to true.");
    setIsLoadingState(true);
    
    let finalItineraryForEvent: CreatorItineraryDay[] = [];
    let itineraryCreatedSuccessfully = false;
    
    try {
      const payload = preparePayload();
      debugLog('Server request payload (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        // setIsLoadingState(false); // Moved to finally block
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log('[useScheduleGenerationRunner] 서버 원본 응답:', serverResponse);
      debugLog('Raw server response (useScheduleGenerationRunner):', serverResponse);
      
      console.log('[useScheduleGenerationRunner] 서버 응답 타입 분석:', {
        응답존재: !!serverResponse,
        객체타입: typeof serverResponse === 'object',
        배열여부: Array.isArray(serverResponse),
        schedule존재: !!serverResponse?.schedule,
        route_summary존재: !!serverResponse?.route_summary,
        schedule길이: serverResponse?.schedule?.length || 0,
        route_summary길이: serverResponse?.route_summary?.length || 0,
        places_routed속성: !!serverResponse?.route_summary?.[0]?.places_routed,
        isNewResponse: isNewServerScheduleResponse(serverResponse)
      });

      if (serverResponse && isNewServerScheduleResponse(serverResponse)) {
        console.log('[useScheduleGenerationRunner] 서버 응답이 유효합니다. 일정 파싱을 시작합니다.');
        
        let parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
        console.log("[useScheduleGenerationRunner] 파싱된 일정 (좌표 업데이트 전):", JSON.parse(JSON.stringify(parsedItinerary)));
        
        if (parsedItinerary.length === 0) {
          console.error('[useScheduleGenerationRunner] 서버 응답 파싱 결과가 빈 배열입니다.');
          toast.error('서버 응답을 처리할 수 없습니다. 다시 시도해 주세요.');
          
          if (dates && selectedPlaces.length > 0) {
            const fallbackItinerary = createItinerary(
              selectedPlaces,
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            
            if (fallbackItinerary.length > 0) {
              setItinerary(fallbackItinerary);
              finalItineraryForEvent = fallbackItinerary;
              setSelectedDay(fallbackItinerary[0].day);
              toast.info('클라이언트에서 대체 일정을 생성했습니다.');
              itineraryCreatedSuccessfully = true;
            }
          }
          // setIsLoadingState(false); // Moved to finally block
          return;
        }
        
        const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any);
        console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정:", JSON.parse(JSON.stringify(itineraryWithCoords)));
        
        setItinerary(itineraryWithCoords);
        finalItineraryForEvent = itineraryWithCoords;
        
        const routesForMapContext: Record<number, ServerRouteResponse> = {};
        itineraryWithCoords.forEach(dayWithCoords => {
            routesForMapContext[dayWithCoords.day] = {
                nodeIds: (dayWithCoords.routeData?.nodeIds.map(id => Number(id))) || [], // Ensure numbers if server expects numbers
                linkIds: (dayWithCoords.routeData?.linkIds.map(id => Number(id))) || [], // Ensure numbers
                interleaved_route: dayWithCoords.interleaved_route?.map(id => typeof id === 'string' ? Number(id) : id),
            };
        });
        
        console.log("[useScheduleGenerationRunner] 지도 콘텍스트에 경로 데이터 설정:", routesForMapContext);
        setServerRoutes(routesForMapContext);
        
        if (itineraryWithCoords.length > 0) {
          setSelectedDay(itineraryWithCoords[0].day);
          toast.success(`${itineraryWithCoords.length}일 일정이 성공적으로 생성되었습니다!`);
          itineraryCreatedSuccessfully = true;
        }
      } else {
        console.error('[useScheduleGenerationRunner] 서버 응답이 필요한 형식을 충족하지 않거나 null입니다.:', serverResponse);
        // toast.error("서버 응답 형식이 올바르지 않습니다. 다시 시도해 주세요."); // Potentially redundant if fallback is created
        
        if (dates && selectedPlaces.length > 0) {
            const fallbackItinerary = createItinerary(
              selectedPlaces,
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            
            setItinerary(fallbackItinerary);
            finalItineraryForEvent = fallbackItinerary;
            
            if (fallbackItinerary.length > 0) {
              setSelectedDay(fallbackItinerary[0].day);
              toast.info("서버 응답 문제로 클라이언트에서 기본 일정이 생성되었습니다.");
              itineraryCreatedSuccessfully = true;
            } else {
              toast.error("대체 일정 생성에도 실패했습니다.");
            }
        } else {
           toast.error("서버 응답이 없어 대체 일정을 생성할 수 없습니다.");
        }
      }
    } catch (error) {
      console.error("일정 생성 중 오류 발생 (useScheduleGenerationRunner):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      
      if (dates && selectedPlaces.length > 0) {
        const fallbackItinerary = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        
        setItinerary(fallbackItinerary);
        finalItineraryForEvent = fallbackItinerary;
        
        if (fallbackItinerary.length > 0) {
          setSelectedDay(fallbackItinerary[0].day);
          toast.info("오류 발생으로 인해 기본 일정을 생성했습니다.");
          itineraryCreatedSuccessfully = true;
        }
      }
    } finally {
      console.log("[useScheduleGenerationRunner] finally 블록 진입.");
      
      if (itineraryCreatedSuccessfully && finalItineraryForEvent.length > 0) {
        console.log("[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생:", JSON.parse(JSON.stringify(finalItineraryForEvent)));
        
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: finalItineraryForEvent,
            selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null,
            showItinerary: true // 중요: 이벤트에 showItinerary 상태 포함
          } 
        });
        window.dispatchEvent(event);
        
        // Optional: Dispatch 'itineraryWithCoordinatesReady' if still needed by other parts of the app
        // const coordsEvent = new CustomEvent('itineraryWithCoordinatesReady', {
        //   detail: { itinerary: finalItineraryForEvent }
        // });
        // console.log("[useScheduleGenerationRunner] 'itineraryWithCoordinatesReady' 이벤트 발생");
        // window.dispatchEvent(coordsEvent);

      } else if (itineraryCreatedSuccessfully && finalItineraryForEvent.length === 0) {
        // This case might happen if fallback itinerary was also empty
        console.log("[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생 (빈 일정, 생성은 시도됨)");
         const event = new CustomEvent('itineraryCreated', {
          detail: {
            itinerary: [],
            selectedDay: null,
            showItinerary: false // No itinerary to show
          }
        });
        window.dispatchEvent(event);
      } else {
        // If no itinerary was successfully created (neither server nor fallback)
        console.log("[useScheduleGenerationRunner] 일정 생성 실패, 'itineraryCreated' 이벤트 (빈 일정, 실패 상태)");
        const event = new CustomEvent('itineraryCreated', {
          detail: {
            itinerary: [],
            selectedDay: null,
            showItinerary: false 
          }
        });
        window.dispatchEvent(event);
      }
      
      // Always set loading to false after all operations
      // Delay slightly to allow event processing
      setTimeout(() => {
        setIsLoadingState(false);
        console.log("[useScheduleGenerationRunner] isLoadingState를 false로 설정 (지연 후).");
        // Dispatch forceRerender if needed, but ensure it doesn't cause loops
        // window.dispatchEvent(new Event('forceRerender')); 
      }, 100);
    }
  }, [
    preparePayload,
    generateScheduleViaHook,
    parseServerResponse,
    geoJsonNodes,
    selectedPlaces,
    setServerRoutes,
    dates,
    createItinerary,
    setItinerary,
    setSelectedDay,
    setIsLoadingState, // Ensure this is stable or correctly memoized
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};

