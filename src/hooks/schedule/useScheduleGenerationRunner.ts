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
    
    let finalItineraryForEvent: CreatorItineraryDay[] = [];
    
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
        
        // Step 1: Parse server response into base ItineraryDay[] structure
        let parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
        console.log("[useScheduleGenerationRunner] Parsed itinerary (before coord update):", JSON.parse(JSON.stringify(parsedItinerary)));
        
        // Step 2: Update itinerary with coordinates from GeoJSON data
        // Ensure geoJsonNodes is correctly typed or cast if necessary for updateItineraryWithCoordinates
        const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any);
        console.log("[useScheduleGenerationRunner] Itinerary with coordinates:", JSON.parse(JSON.stringify(itineraryWithCoords)));
        
        setItinerary(itineraryWithCoords);
        finalItineraryForEvent = itineraryWithCoords;
        
        const routesForMapContext: Record<number, ServerRouteResponse> = {};
        // Day calculation for routesForMapContext should align with ItineraryDay's day property
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
            setTimeout(() => {
              console.log("[useScheduleGenerationRunner] Dispatching forceRerender event after fallback generation");
              window.dispatchEvent(new Event('forceRerender'));
            }, 0);
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
        finalItineraryForEvent = generatedItinerary;

        if (generatedItinerary.length > 0) {
          setSelectedDay(generatedItinerary[0].day);
        }
        setTimeout(() => {
          console.log("[useScheduleGenerationRunner] Dispatching forceRerender event after error fallback");
          window.dispatchEvent(new Event('forceRerender'));
        }, 0);
      }
    } finally {
      console.log("[useScheduleGenerationRunner] Entering finally block. Attempting to set isLoadingState to false.");
      
      setIsLoadingState(false);
      console.log("[useScheduleGenerationRunner] setIsLoadingState(false) has been called in finally block.");

      if (finalItineraryForEvent.length > 0) {
        console.log("[useScheduleGenerationRunner] Dispatching 'itineraryCreated' event with itinerary:", JSON.parse(JSON.stringify(finalItineraryForEvent)));
        
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
      } else {
        console.log("[useScheduleGenerationRunner] Dispatching 'itineraryCreated' event with empty itinerary.");
        
        setTimeout(() => {
          const event = new CustomEvent('itineraryCreated', {
            detail: {
              itinerary: [],
              selectedDay: null
            }
          });
          window.dispatchEvent(event);
          
          setTimeout(() => {
            console.log("[useScheduleGenerationRunner] Dispatching 'forceRerender' event after empty itinerary");
            window.dispatchEvent(new Event('forceRerender'));
          }, 100);
        }, 100);
      }
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
