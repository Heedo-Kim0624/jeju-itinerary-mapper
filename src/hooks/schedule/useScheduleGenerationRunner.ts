import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace, Place as SupabasePlace } from '@/types/supabase'; // SupabasePlace for casting
import { 
  NewServerScheduleResponse, 
  ServerRouteResponse, 
  isNewServerScheduleResponse as serverResponseTypeGuard,
  ItineraryDay as ScheduleItineraryDay,
  ItineraryPlace as ScheduleItineraryPlace
} from '@/types/schedule';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser } from './useScheduleParser';
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
  setItinerary: (itinerary: ScheduleItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
}

function convertCreatorToScheduleItinerary(creatorItinerary: CreatorItineraryDay[], tripStartDate?: Date): ScheduleItineraryDay[] {
  return creatorItinerary.map((creatorDay, index) => {
    const schedulePlaces: ScheduleItineraryPlace[] = creatorDay.places.map(creatorPlace => {
      // CreatorItineraryPlace extends supabase.Place. ScheduleItineraryPlace also extends supabase.Place.
      // Perform a safe cast, assuming structure is compatible or default values cover missing fields.
      const { ...restOfCreatorPlace } = creatorPlace;
      return {
        ...restOfCreatorPlace, // Spread properties from creatorPlace (which is SupabasePlace based)
        // Ensure specific ScheduleItineraryPlace fields are present
        timeBlock: creatorPlace.timeBlock || '', 
        node_id: creatorPlace.node_id || undefined,
      } as ScheduleItineraryPlace; // Cast, ensure all fields of ScheduleItineraryPlace exist or are defaulted
    });

    let dayOfWeek = '';
    let date = '';
    if (tripStartDate) {
        const currentDayDate = new Date(tripStartDate);
        currentDayDate.setDate(tripStartDate.getDate() + index); // index is 0-based day number for the map
        dayOfWeek = currentDayDate.toLocaleDateString('en-US', { weekday: 'short' });
        date = `${String(currentDayDate.getMonth() + 1).padStart(2, '0')}/${String(currentDayDate.getDate()).padStart(2, '0')}`;
    }


    return {
      day: creatorDay.day,
      dayOfWeek: dayOfWeek, 
      date: date,      
      places: schedulePlaces,
      totalDistance: creatorDay.totalDistance,
      interleaved_route: creatorDay.interleaved_route || [],
      routeData: creatorDay.routeData ? {
        nodeIds: creatorDay.routeData.nodeIds?.map(String) || [],
        linkIds: creatorDay.routeData.linkIds?.map(String) || [],
      } : undefined,
    };
  });
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
  // const { generateSchedule: generateScheduleViaHookFromAPIRoute } = useScheduleGeneratorHook(); // This refers to the /api/generate-itinerary flow
  const { createItinerary: clientSideCreateItinerary } = useItineraryCreator();
  const { setServerRoutes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess started.");
    setIsLoadingState(true);
    
    let finalItineraryForEvent: ScheduleItineraryDay[] = [];
    
    try {
      const payload = preparePayload();
      debugLog('서버 요청 페이로드 (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return;
      }
      
      const SERVER_BASE_URL_RUNNER = import.meta.env.VITE_SCHEDULE_API;
      const SCHEDULE_GENERATION_ENDPOINT_RUNNER = "/generate_schedule";
      const fullApiUrlRunner = `${SERVER_BASE_URL_RUNNER}${SCHEDULE_GENERATION_ENDPOINT_RUNNER}`;

      const serverResponseRaw = await fetch(fullApiUrlRunner, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!serverResponseRaw.ok) {
        const errorText = await serverResponseRaw.text();
        throw new Error(`Runner: Server error (${serverResponseRaw.status}): ${errorText}`);
      }
      const serverResponseData = await serverResponseRaw.json();
      
      debugLog('서버 원본 응답 (useScheduleGenerationRunner via VITE_SCHEDULE_API):', serverResponseData);
      
      if (serverResponseData && serverResponseTypeGuard(serverResponseData) &&
          serverResponseData.route_summary && serverResponseData.route_summary.length > 0) {
        
        const parsedItinerary = parseServerResponse(serverResponseData, dates?.startDate || new Date());
        setItinerary(parsedItinerary);
        finalItineraryForEvent = parsedItinerary;
        
        const routesForMapContext: Record<number, ServerRouteResponse> = {};
        parsedItinerary.forEach(dayItem => {
            if (dayItem.interleaved_route) {
                 routesForMapContext[dayItem.day] = {
                    nodeIds: extractAllNodesFromRoute(dayItem.interleaved_route).map(String),
                    linkIds: extractAllLinksFromRoute(dayItem.interleaved_route).map(String),
                    interleaved_route: dayItem.interleaved_route,
                };
            }
        });
        setServerRoutes(routesForMapContext);
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day);
          toast.success(`${parsedItinerary.length}일 일정이 성공적으로 생성되었습니다!`);
        } else {
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
        }

      } else {
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다. (VITE_SCHEDULE_API)");
        if (dates) {
            const clientFallbackItinerary = clientSideCreateItinerary(
              selectedPlaces as SupabasePlace[], // Cast SelectedPlace[] to Place[]
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            const scheduleCompatibleFallback = convertCreatorToScheduleItinerary(clientFallbackItinerary, dates.startDate);
            setItinerary(scheduleCompatibleFallback);
            finalItineraryForEvent = scheduleCompatibleFallback;

            if (scheduleCompatibleFallback.length > 0) {
              setSelectedDay(scheduleCompatibleFallback[0].day);
            }
            toast.info("클라이언트에서 기본 일정이 생성되었습니다.");
        }
      }
    } catch (error) {
      console.error("Error during schedule generation (useScheduleGenerationRunner):", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      if (dates) {
        const clientFallbackItinerary = clientSideCreateItinerary(
          selectedPlaces as SupabasePlace[],
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        const scheduleCompatibleFallback = convertCreatorToScheduleItinerary(clientFallbackItinerary, dates.startDate);
        setItinerary(scheduleCompatibleFallback);
        finalItineraryForEvent = scheduleCompatibleFallback;

        if (scheduleCompatibleFallback.length > 0) {
          setSelectedDay(scheduleCompatibleFallback[0].day);
        }
      }
    } finally {
      // ... keep existing code for finally block (setIsLoadingState, event dispatch)
      console.log("[useScheduleGenerationRunner] Entering finally block. Attempting to set isLoadingState to false.");
      setIsLoadingState(false);
      console.log("[useScheduleGenerationRunner] setIsLoadingState(false) has been called in finally block.");

      if (finalItineraryForEvent.length > 0) {
        console.log("[useScheduleGenerationRunner] Dispatching 'itineraryCreated' event with itinerary:", finalItineraryForEvent);
        setTimeout(() => {
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: finalItineraryForEvent,
              selectedDay: finalItineraryForEvent[0].day
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
            detail: { itinerary: [], selectedDay: null }
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
    parseServerResponse,
    selectedPlaces,
    setServerRoutes,
    dates,
    clientSideCreateItinerary,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
