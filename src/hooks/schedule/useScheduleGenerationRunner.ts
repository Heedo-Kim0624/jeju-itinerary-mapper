
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
  startDatetime: string | null;
  endDatetime: string | null;
  setItinerary: (itinerary: CreatorItineraryDay[]) => void;
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationRunner = ({
  selectedPlaces,
  dates,
  startDatetime, // useScheduleManagement에서 전달된 prop 이름 (ISO 문자열이어야 함)
  endDatetime,   // useScheduleManagement에서 전달된 prop 이름 (ISO 문자열이어야 함)
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
    setIsLoadingState(true);
    
    let finalItineraryForEvent: CreatorItineraryDay[] = [];
    
    try {
      const payload = preparePayload();
      debugLog('서버 요청 페이로드 (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        // setIsLoadingState(false); // finally 블록에서 처리
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
        console.log("[useScheduleGenerationRunner] 파싱된 일정:", parsedItinerary);
        
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
        
        console.log("[useScheduleGenerationRunner] 지도에 경로 데이터 설정:", routesForMapContext);
        setServerRoutes(routesForMapContext);
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day as number);
          toast.success(`${parsedItinerary.length}일 일정이 성공적으로 생성되었습니다!`);
        } else {
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
          // setIsLoadingState(false); // finally 블록에서 처리
        }
      } else {
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다.");
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성 시도합니다 (useScheduleGenerationRunner).");
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
        } else {
            // setIsLoadingState(false); // finally 블록에서 처리 (날짜 정보 없는 경우)
        }
      }
    } catch (error) {
      console.error("일정 생성 오류 (useScheduleGenerationRunner):", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      // setIsLoadingState(false); // finally 블록에서 처리
      
      if (dates) {
        console.warn("오류 발생으로 클라이언트 측 일정을 생성합니다 (useScheduleGenerationRunner).");
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
      }
    } finally {
      // 프로세스 완료 후 로딩 상태 해제
      setIsLoadingState(false);
      console.log("[useScheduleGenerationRunner] setIsLoadingState(false) 호출됨 in finally");

      if (finalItineraryForEvent.length > 0) {
        console.log("일정 생성 완료 이벤트 발생:", finalItineraryForEvent);
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: finalItineraryForEvent,
            selectedDay: finalItineraryForEvent[0].day
          } 
        });
        window.dispatchEvent(event);
      } else {
        console.log("빈 일정으로 이벤트 발생");
        const event = new CustomEvent('itineraryCreated', {
          detail: {
            itinerary: [],
            selectedDay: null
          }
        });
        window.dispatchEvent(event);
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
    // isGenerating // isGeneratingFromHook을 isGenerating으로 사용하려면 여기서 반환해야 하지만, 현재 사용되지 않음
  };
};
