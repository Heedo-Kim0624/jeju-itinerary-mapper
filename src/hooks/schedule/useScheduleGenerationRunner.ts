
import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase';
import { NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse } from '@/types/schedule';
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
  const { setServerRoutes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] 일정 생성 프로세스 시작");
    // 로딩 상태 설정
    setIsLoadingState(true);
    console.log("[useScheduleGenerationRunner] 로딩 상태 설정: true");
    
    let finalItineraryForEvent: CreatorItineraryDay[] = [];
    let success = false;
    
    try {
      const payload = preparePayload();
      debugLog('서버 요청 페이로드:', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        return;
      }

      console.log("[useScheduleGenerationRunner] 서버에 일정 생성 요청 보내기");
      const serverResponse = await generateScheduleViaHook(payload);
      console.log("[useScheduleGenerationRunner] 서버 응답 수신:", serverResponse);
      
      if (serverResponse && isNewServerScheduleResponse(serverResponse) &&
          serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        
        console.log("[useScheduleGenerationRunner] 서버 응답 파싱 시작");
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
        
        console.log("[useScheduleGenerationRunner] 지도 라우트 데이터 설정:", routesForMapContext);
        setServerRoutes(routesForMapContext);
        
        if (parsedItinerary.length > 0) {
          console.log(`[useScheduleGenerationRunner] 일정 생성 성공: ${parsedItinerary.length}일 일정`);
          setSelectedDay(parsedItinerary[0].day as number);
          toast.success(`${parsedItinerary.length}일 일정이 생성되었습니다!`);
          success = true;
        } else {
          console.log("[useScheduleGenerationRunner] 일정 생성 실패: 장소 정보 부족");
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
        }
      } else {
        console.log("[useScheduleGenerationRunner] 서버 응답 불충분, 클라이언트 일정 생성 시도");
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다.");
        
        if (dates) {
            console.log("[useScheduleGenerationRunner] 클라이언트 측 일정 생성 시작");
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
              success = true;
            }
            toast.info("클라이언트에서 기본 일정이 생성되었습니다. (서버 응답 부족)");
        }
      }
    } catch (error) {
      console.error("[useScheduleGenerationRunner] 일정 생성 중 오류 발생:", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      
      if (dates) {
        console.log("[useScheduleGenerationRunner] 오류 발생, 클라이언트 측 일정 생성 시도");
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
          success = true;
        }
      }
    } finally {
      console.log("[useScheduleGenerationRunner] 일정 생성 프로세스 완료");
      
      // 명시적으로 로딩 상태 해제 (중요!)
      console.log("[useScheduleGenerationRunner] 로딩 상태 명시적 해제 (finally 블록)");
      setIsLoadingState(false);
      
      // 최종 일정 생성 결과 이벤트 발생
      if (finalItineraryForEvent.length > 0) {
        console.log(`[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생: ${finalItineraryForEvent.length}일 일정`);
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: finalItineraryForEvent,
            selectedDay: finalItineraryForEvent[0].day,
            success: success
          } 
        });
        window.dispatchEvent(event);
        
        // 강제 리렌더링을 위한 이벤트 발생 (100ms 지연)
        setTimeout(() => {
          console.log("[useScheduleGenerationRunner] 강제 리렌더링 이벤트 발생");
          const forceEvent = new Event('forceRerender');
          window.dispatchEvent(forceEvent);
        }, 100);
      } else {
        console.log("[useScheduleGenerationRunner] 빈 일정으로 'itineraryCreated' 이벤트 발생");
        const event = new CustomEvent('itineraryCreated', {
          detail: {
            itinerary: [],
            selectedDay: null,
            success: false
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
  };
};
