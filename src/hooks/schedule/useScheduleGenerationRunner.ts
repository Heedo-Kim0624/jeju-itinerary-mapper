import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace, Place as SupabasePlace } from '@/types/supabase'; // SupabasePlace for casting
import { 
  NewServerScheduleResponse, 
  ServerRouteResponse, 
  isNewServerScheduleResponse as serverResponseTypeGuard,
  ItineraryDay as ScheduleItineraryDay,
  ItineraryPlaceWithTime as ScheduleItineraryPlaceWithTime
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
    const schedulePlaces: ScheduleItineraryPlaceWithTime[] = creatorDay.places.map(creatorPlace => {
      // creatorPlace는 SupabasePlace를 확장하므로, ScheduleItineraryPlaceWithTime의 기본 속성은 대부분 호환됨
      // 누락될 수 있는 ItineraryPlaceWithTime 고유 필드(timeBlock, arriveTime 등)는 undefined 또는 기본값 처리
      const { 
        // Place에서 상속받는 필드들은 그대로 사용 가능
        // ItineraryPlaceWithTime에만 있거나, creatorPlace에 없을 수 있는 필드 처리
        timeBlock, // use-itinerary-creator.ts의 ItineraryPlace에 timeBlock이 있는지 확인 필요
        arriveTime, departTime, stayDuration, travelTimeToNext, // 이들은 use-itinerary-creator.ts의 ItineraryPlace에 없을 가능성 높음
        ...restOfCreatorPlace // Place에서 온 나머지 속성들
      } = creatorPlace as any; // SupabasePlace를 확장하므로, 일단 any로 캐스팅 후 필요한 필드 채움

      return {
        ...(restOfCreatorPlace as SupabasePlace), // Place 기본 속성들
        id: String(restOfCreatorPlace.id), // id는 string으로 통일
        node_id: restOfCreatorPlace.node_id, // node_id 유지
        category: restOfCreatorPlace.category || '기타', // category 기본값
        // ItineraryPlaceWithTime에 필요한 추가/특화 필드
        timeBlock: timeBlock || '', 
        arriveTime: arriveTime || undefined,
        departTime: departTime || undefined,
        stayDuration: stayDuration || undefined,
        travelTimeToNext: travelTimeToNext || undefined,
      } as ScheduleItineraryPlaceWithTime;
    });

    let dayOfWeek = '';
    let date = '';
    if (tripStartDate) {
        const currentDayDate = new Date(tripStartDate);
        currentDayDate.setDate(tripStartDate.getDate() + index);
        dayOfWeek = currentDayDate.toLocaleDateString('en-US', { weekday: 'short' });
        date = `${String(currentDayDate.getMonth() + 1).padStart(2, '0')}/${String(currentDayDate.getDate()).padStart(2, '0')}`;
    }

    return {
      day: creatorDay.day,
      dayOfWeek: dayOfWeek, 
      date: date,      
      places: schedulePlaces,
      totalDistance: creatorDay.totalDistance, // km 단위라고 가정
      // ItineraryDay (from schedule.ts)에 interleaved_route와 routeData가 옵셔널로 있으므로 에러 발생 안 함
      interleaved_route: (creatorDay as any).interleaved_route || [], // CreatorItineraryDay에 해당 필드가 없다면 any 캐스팅 필요
      routeData: (creatorDay as any).routeData ? { // CreatorItineraryDay에 해당 필드가 없다면 any 캐스팅 필요
        nodeIds: (creatorDay as any).routeData.nodeIds?.map(String) || [],
        linkIds: (creatorDay as any).routeData.linkIds?.map(String) || [],
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
            if (dayItem.interleaved_route) { // Optional chaining으로 안전하게 접근
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
