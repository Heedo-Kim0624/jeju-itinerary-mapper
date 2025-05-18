
import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace, ItineraryPlaceWithTime } from '@/types/supabase';
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
  startDatetime,
  endDatetime,
  setItinerary,
  setSelectedDay,
  setIsLoadingState,
}: UseScheduleGenerationRunnerProps) => {
  const { generateSchedule: generateScheduleViaHook, isGenerating } = useScheduleGeneratorHook();
  const { createItinerary } = useItineraryCreator();
  const { setServerRoutes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ selectedPlaces, startDatetime, endDatetime });
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const runScheduleGenerationProcess = useCallback(async () => {
    // 로딩 상태를 먼저 설정하여 UI가 즉시 반응하도록 함
    setIsLoadingState(true);
    
    let finalItineraryForEvent: CreatorItineraryDay[] = [];
    
    try {
      const payload = preparePayload();
      debugLog('서버 요청 페이로드 (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return;
      }

      // 서버에 일정 생성 요청
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
        
        // itinerary 상태 업데이트 - 이 시점에서 로딩 상태가 false로 되어야 함
        setItinerary(parsedItinerary);
        finalItineraryForEvent = parsedItinerary;
        
        // 지도에 표시할 경로 데이터 구성
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
        
        // 지도 컨텍스트에 경로 데이터 설정
        console.log("[useScheduleGenerationRunner] 지도에 경로 데이터 설정:", routesForMapContext);
        setServerRoutes(routesForMapContext);
        
        if (parsedItinerary.length > 0) {
          // 첫 번째 일차 선택 (UI에 표시할 기본 일차)
          setSelectedDay(parsedItinerary[0].day as number);
          toast.success(`${parsedItinerary.length}일 일정이 성공적으로 생성되었습니다!`);
        } else {
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
          setIsLoadingState(false); // 오류 발생 시 명시적으로 로딩 상태 해제
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
            setIsLoadingState(false); // 날짜 정보가 없어 일정 생성이 불가능한 경우 로딩 상태 해제
        }
      }
    } catch (error) {
      console.error("일정 생성 오류 (useScheduleGenerationRunner):", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      setIsLoadingState(false); // 오류 발생 시 명시적으로 로딩 상태 해제
      
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
      // 일정 생성 프로세스가 완료된 후, 이벤트 발생 시키기 위한 코드
      if (finalItineraryForEvent.length > 0) {
        console.log("일정 생성 완료 이벤트 발생:", finalItineraryForEvent);
        
        // CustomEvent 생성 및 디스패치
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: finalItineraryForEvent,
            selectedDay: finalItineraryForEvent[0].day
          } 
        });
        window.dispatchEvent(event);
        
        // 로딩 상태는 이벤트 핸들러에서 useEffect를 통해 처리되도록 함
        // setIsLoadingState(false); // 주석 처리 - useScheduleStateAndEffects의 useEffect에서 처리
      } else {
        console.log("빈 일정으로 이벤트 발생");
        const event = new CustomEvent('itineraryCreated', {
          detail: {
            itinerary: [],
            selectedDay: null
          }
        });
        window.dispatchEvent(event);
        
        // 빈 일정인 경우 여기서 명시적으로 로딩 상태 해제
        setIsLoadingState(false);
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
    isGenerating 
  };
};
