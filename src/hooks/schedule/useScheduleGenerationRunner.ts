import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase';
import { NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse } from '@/types/schedule';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser, updateItineraryWithCoordinates } from './useScheduleParser';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

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
    
    let finalItineraryForEvent: CreatorItineraryDay[] = []; // This will be set by server or client fallback
    
    try {
      const payload = preparePayload();
      debugLog('Server request payload (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      debugLog('Raw server response (useScheduleGenerationRunner):', serverResponse);
      debugLog('Server response type check (useScheduleGenerationRunner):', {
        isNull: serverResponse === null,
        isObject: typeof serverResponse === 'object',
        isArray: Array.isArray(serverResponse),
        hasSchedule: !!serverResponse?.schedule,
        hasRouteSummary: !!serverResponse?.route_summary,
        isNewResponse: isNewServerScheduleResponse(serverResponse)
      });

      if (serverResponse && isNewServerScheduleResponse(serverResponse) &&
          serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        
        // 1. 서버 응답을 ItineraryDay[] 구조로 변환
        let parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
        console.log("[useScheduleGenerationRunner] 파싱된 일정 (좌표 업데이트 전):", JSON.parse(JSON.stringify(parsedItinerary)));
        
        // 2. GeoJSON 데이터에서 좌표 정보 추가
        // Ensure geoJsonNodes is correctly typed or cast if necessary for updateItineraryWithCoordinates
        const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any);
        console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정:", JSON.parse(JSON.stringify(itineraryWithCoords)));
        
        // 3. 메모리에 일정 데이터 저장
        setItinerary(itineraryWithCoords);
        finalItineraryForEvent = itineraryWithCoords; // Set for the finally block event dispatch
        
        // 4. 이벤트 발생 (데이터 포함) - This specific event dispatch location is per user's 2.1 snippet
        // However, the original code dispatches in `finally` block, which might be more robust.
        // For now, following user snippet for this part, but this might need review if issues persist.
        // The finally block ensures event dispatch regardless of success/error within try.
        // If we dispatch here, the finally block's dispatch might become redundant or conflicting for success cases.
        // For this iteration, I'm keeping the primary event dispatch in the `finally` block as it was,
        // and `finalItineraryForEvent` will carry the data. The console logs from the user are added.
        // If the intent was to dispatch *only* on success here and *not* in finally, that's a larger change.
        // The user's snippet for 2.1 implies dispatching here directly. Let's adjust based on that for now.

        if (itineraryWithCoords.length > 0) {
           // The event for successful server response will be handled by the finally block
           // after setting finalItineraryForEvent.
           // The code below for setServerRoutes and toast is for successful server processing path.
        }
        
        const routesForMapContext: Record<number, ServerRouteResponse> = {};
        itineraryWithCoords.forEach(dayWithCoords => {
            if (dayWithCoords.routeData?.nodeIds && dayWithCoords.routeData?.linkIds) {
                routesForMapContext[dayWithCoords.day] = {
                    nodeIds: dayWithCoords.routeData.nodeIds,
                    linkIds: dayWithCoords.routeData.linkIds,
                    interleaved_route: dayWithCoords.interleaved_route,
                };
            }
        });
        
        console.log("[useScheduleGenerationRunner] Setting route data for map:", routesForMapContext);
        setServerRoutes(routesForMapContext);
        
        if (itineraryWithCoords.length > 0) {
          setSelectedDay(itineraryWithCoords[0].day as number);
          toast.success(`${itineraryWithCoords.length}일 일정이 성공적으로 생성되었습니다!`);
        } else {
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
          // Ensure finalItineraryForEvent is empty if no places, so finally block dispatches correctly
          finalItineraryForEvent = []; 
        }
      } else {
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다.");
        console.warn("Server response missing or malformed. Attempting client-side schedule generation (useScheduleGenerationRunner).");
        
        if (dates) {
            const generatedItinerary: CreatorItineraryDay[] = createItinerary(
              selectedPlaces,
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            setItinerary(generatedItinerary);
            finalItineraryForEvent = generatedItinerary;

            if (generatedItinerary.length > 0) {
              setSelectedDay(generatedItinerary[0].day);
            }
            toast.info("클라이언트에서 기본 일정이 생성되었습니다. (서버 응답 부족)");
        }
      }
    } catch (error) {
      console.error("Error during schedule generation (useScheduleGenerationRunner):", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      
      if (dates) {
        console.warn("Error occurred. Generating client-side schedule as fallback (useScheduleGenerationRunner).");
        const generatedItinerary: CreatorItineraryDay[] = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        setItinerary(generatedItinerary);
        finalItineraryForEvent = generatedItinerary; // Set for the finally block

        if (generatedItinerary.length > 0) {
          setSelectedDay(generatedItinerary[0].day);
        }
      }
    } finally {
      console.log("[useScheduleGenerationRunner] Entering finally block. Attempting to set isLoadingState to false.");
      
      setIsLoadingState(false);
      console.log("[useScheduleGenerationRunner] setIsLoadingState(false) has been called in finally block.");

      // Dispatch itineraryCreated event based on finalItineraryForEvent
      // This ensures an event is dispatched whether from server success, client fallback, or error fallback.
      console.log("[useScheduleGenerationRunner] Dispatching 'itineraryCreated' event with final itinerary:", JSON.parse(JSON.stringify(finalItineraryForEvent)));
      
      // The setTimeouts here were for ensuring LeftPanel has time to re-render.
      // Keeping them for now as they were part of the previously working logic.
      setTimeout(() => {
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: finalItineraryForEvent,
            selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null
          } 
        });
        window.dispatchEvent(event);
        
        setTimeout(() => {
          console.log("[useScheduleGenerationRunner] Dispatching 'forceRerender' event for LeftPanel update");
          window.dispatchEvent(new Event('forceRerender'));
        }, 100);
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
    setIsLoadingState,
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
