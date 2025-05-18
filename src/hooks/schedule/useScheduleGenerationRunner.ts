
import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase'; // ItineraryPlaceWithTime 제거 (선언되었으나 사용되지 않음)
import { NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse } from '@/types/schedule';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser } from './useScheduleParser';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

const DEBUG_MODE = true; // 또는 환경 변수로 관리

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null; // Changed from startDatetimeISO
  endDatetime: string | null;   // Changed from endDatetimeISO
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
  const { generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook(); // isGenerating 제거 (선언되었으나 사용되지 않음)
  const { createItinerary } = useItineraryCreator();
  const { setServerRoutes } = useMapContext();
  
  // useSchedulePayload에 ISO 문자열 prop 이름으로 전달
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
      debugLog('서버 요청 페이로드 (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false); // 추가: 로딩 상태 해제
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      debugLog('서버 원본 응답 (useScheduleGenerationRunner):', serverResponse);
      debugLog('서버 응답 타입 검사 (useScheduleGenerationRunner):', {
        isNull: serverResponse === null,
        isObject: typeof serverResponse === 'object',
        isArray: Array.isArray(serverResponse),
        hasSchedule: !!serverResponse?.schedule,
        hasRouteSummary: !!serverResponse?.route_summary,
        isNewServerScheduleResponse: isNewServerScheduleResponse(serverResponse)
      });

      if (serverResponse && isNewServerScheduleResponse(serverResponse) &&
          serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        
        const parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
        console.log("[useScheduleGenerationRunner] Parsed itinerary:", parsedItinerary);
        
        setItinerary(parsedItinerary);
        finalItineraryForEvent = parsedItinerary;
        
        const routesForMapContext: Record<number, ServerRouteResponse> = {};
        const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const tripStartDayOfWeek = (dates?.startDate || new Date()).getDay();

        serverResponse.route_summary.forEach(summaryItem => {
            const routeDayOfWeekString = summaryItem.day.substring(0, 3);
            const routeDayOfWeek = dayOfWeekMap[routeDayOfWeekString];
            let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
            if (tripDayNumber <= 0) tripDayNumber += 7;

            routesForMapContext[tripDayNumber] = {
                nodeIds: extractAllNodesFromRoute(summaryItem.interleaved_route).map(String),
                linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
                interleaved_route: summaryItem.interleaved_route,
            };
        });
        
        console.log("[useScheduleGenerationRunner] Setting route data for map:", routesForMapContext);
        setServerRoutes(routesForMapContext);
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day as number);
          toast.success(`${parsedItinerary.length}일 일정이 성공적으로 생성되었습니다!`);
        } else {
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
        }
      } else {
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다.");
        console.warn("Server response missing or malformed. Attempting client-side schedule generation (useScheduleGenerationRunner).");
        
        // 추가: 상태 초기화 및 로딩 상태 해제 명시적 처리
        // setIsLoadingState(false); // Moved to finally block

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
            // 추가: fallback 일정 생성 후 강제 리렌더링 이벤트 발생
            setTimeout(() => {
              console.log("[useScheduleGenerationRunner] Dispatching forceRerender event after fallback generation");
              window.dispatchEvent(new Event('forceRerender'));
            }, 0);
        }
      }
    } catch (error) {
      console.error("Error during schedule generation (useScheduleGenerationRunner):", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      
      // 추가: 상태 초기화 및 로딩 상태 해제 명시적 처리
      // setIsLoadingState(false); // Moved to finally block
      
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
        // 추가: 에러 발생 후 fallback 일정 생성 시 강제 리렌더링 이벤트 발생
        setTimeout(() => {
          console.log("[useScheduleGenerationRunner] Dispatching forceRerender event after error fallback");
          window.dispatchEvent(new Event('forceRerender'));
        }, 0);
      }
    } finally {
      console.log("[useScheduleGenerationRunner] Entering finally block. Attempting to set isLoadingState to false.");
      
      // 명시적으로 로딩 상태 해제
      setIsLoadingState(false);
      console.log("[useScheduleGenerationRunner] setIsLoadingState(false) has been called in finally block.");

      // 일정 생성 완료 후 LeftPanel 강제 업데이트를 위한 이벤트 발생
      if (finalItineraryForEvent.length > 0) {
        console.log("[useScheduleGenerationRunner] Dispatching 'itineraryCreated' event with itinerary:", finalItineraryForEvent);
        
        // 이벤트 발생 전 약간의 지연 추가 (상태 업데이트 완료 보장)
        setTimeout(() => {
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: finalItineraryForEvent,
              selectedDay: finalItineraryForEvent[0].day
            } 
          });
          window.dispatchEvent(event);
          
          // 추가: 강제 리렌더링 이벤트 발생 (약간 지연)
          setTimeout(() => {
            console.log("[useScheduleGenerationRunner] Dispatching 'forceRerender' event for LeftPanel update");
            window.dispatchEvent(new Event('forceRerender'));
          }, 100);
        }, 100);
      } else {
        console.log("[useScheduleGenerationRunner] Dispatching 'itineraryCreated' event with empty itinerary.");
        
        // 이벤트 발생 전 약간의 지연 추가 (상태 업데이트 완료 보장)
        setTimeout(() => {
          const event = new CustomEvent('itineraryCreated', {
            detail: {
              itinerary: [],
              selectedDay: null
            }
          });
          window.dispatchEvent(event);
          
          // 추가: 강제 리렌더링 이벤트 발생 (약간 지연)
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
