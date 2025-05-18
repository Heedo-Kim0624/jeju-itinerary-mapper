
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { SelectedPlace, ItineraryPlaceWithTime, ItineraryDay as DomainItineraryDay } from '@/types/supabase'; // Renamed to avoid conflict
import { NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse } from '@/types/schedule';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser } from './useScheduleParser';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

const DEBUG_MODE = true; // Or manage this via an env variable

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetimeISO: string | null;
  endDatetimeISO: string | null;
  setItinerary: (itinerary: DomainItineraryDay[]) => void; // Use DomainItineraryDay
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
}

export const useScheduleGenerationRunner = ({
  selectedPlaces,
  dates,
  startDatetimeISO,
  endDatetimeISO,
  setItinerary,
  setSelectedDay,
  setIsLoadingState,
}: UseScheduleGenerationRunnerProps) => {
  const { generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook();
  const { createItinerary } = useItineraryCreator();
  const { setServerRoutes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ selectedPlaces, startDatetimeISO, endDatetimeISO });
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const [lastServerResponse, setLastServerResponse] = useState<any>(null);
  const [lastError, setLastError] = useState<any>(null);

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("🚀 일정 생성 프로세스 시작 (useScheduleGenerationRunner)");
    setIsLoadingState(true);
    setLastError(null);
    setLastServerResponse(null);
    let finalItineraryForEvent: DomainItineraryDay[] = [];

    try {
      const payload = preparePayload();
      debugLog('서버 요청 페이로드 (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        // setIsLoadingState(false); // Moved to finally
        return; // Return early, finally will handle loading state
      }

      console.log("📤 서버에 일정 생성 요청 전송 (useScheduleGenerationRunner)");
      const serverResponse = await generateScheduleViaHook(payload);
      console.log("📥 서버 응답 수신 (useScheduleGenerationRunner):", serverResponse);
      setLastServerResponse(serverResponse);
      debugLog('서버 원본 응답 (useScheduleGenerationRunner):', serverResponse);
      debugLog('서버 응답 타입 검사 (useScheduleGenerationRunner):', {
        isNull: serverResponse === null,
        isObject: typeof serverResponse === 'object',
        isArray: Array.isArray(serverResponse),
        hasSchedule: !!serverResponse?.schedule,
        hasRouteSummary: !!serverResponse?.route_summary,
        isNewServerScheduleResponse: isNewServerScheduleResponse(serverResponse)
      });
      
      if (!serverResponse) {
        throw new Error("서버 응답이 없습니다 (null or undefined).");
      }
      
      if (!isNewServerScheduleResponse(serverResponse) || !serverResponse.route_summary || serverResponse.route_summary.length === 0) {
        console.warn("서버 응답이 없거나, 경로 정보가 부족하여 클라이언트 측 일정 생성을 시도합니다.", serverResponse);
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다.");
        if (dates) {
             const clientGeneratedItinerary: CreatorItineraryDay[] = createItinerary(
              selectedPlaces,
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            // Adapt CreatorItineraryDay[] to DomainItineraryDay[]
            const domainClientItinerary: DomainItineraryDay[] = clientGeneratedItinerary.map(day => ({
              ...day,
              places: day.places.map(p => ({...p, timeBlock: p.timeBlock || "시간 정보 없음"}) as ItineraryPlaceWithTime),
            }));

            setItinerary(domainClientItinerary);
            finalItineraryForEvent = domainClientItinerary;

            if (domainClientItinerary.length > 0) {
              setSelectedDay(domainClientItinerary[0].day);
              toast.info("클라이언트에서 기본 일정이 생성되었습니다. (서버 응답 부족)");
            } else {
              toast.error("클라이언트에서도 일정을 생성하지 못했습니다.");
            }
        } else {
          throw new Error("날짜 정보가 없어 클라이언트 측 일정도 생성할 수 없습니다.");
        }
      } else {
        console.log("🔄 서버 응답 파싱 시작 (useScheduleGenerationRunner)");
        // parseServerResponse returns DomainItineraryDay[] already
        const parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
        
        if (!parsedItinerary || parsedItinerary.length === 0) {
          throw new Error("서버 응답에서 유효한 일정을 파싱할 수 없습니다.");
        }
        
        console.log("✅ 파싱된 일정 (useScheduleGenerationRunner):", parsedItinerary);
        setItinerary(parsedItinerary);
        finalItineraryForEvent = parsedItinerary;
        
        const routesForMapContext: Record<number, ServerRouteResponse> = {};
        const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const tripStartDayOfWeek = (dates?.startDate || new Date()).getDay();

        serverResponse.route_summary.forEach(summaryItem => {
            const routeDayOfWeekString = summaryItem.day.substring(0, 3); // Mon, Tue, etc.
            const routeDayOfWeek = dayOfWeekMap[routeDayOfWeekString];
            let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
            if (tripDayNumber <= 0) tripDayNumber += 7;

            routesForMapContext[tripDayNumber] = {
                nodeIds: extractAllNodesFromRoute(summaryItem.interleaved_route).map(String),
                linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
                interleaved_route: summaryItem.interleaved_route,
            };
        });
        console.log("🗺️ 지도 컨텍스트 업데이트 (useScheduleGenerationRunner):", Object.keys(routesForMapContext).length);
        setServerRoutes(routesForMapContext);
        
        if (parsedItinerary.length > 0) {
          console.log("📅 첫 번째 일자 선택 (useScheduleGenerationRunner):", parsedItinerary[0].day);
          setSelectedDay(parsedItinerary[0].day as number);
          toast.success(`${parsedItinerary.length}일 일정이 성공적으로 생성되었습니다!`);
        } else {
           // This case should be caught by earlier check, but as a safeguard
          throw new Error("파싱 후 생성된 일정이 없습니다.");
        }
      }
    } catch (error: any) {
      console.error("❌ 일정 생성 오류 (useScheduleGenerationRunner):", error);
      setLastError(error);
      toast.error(`일정 생성 중 오류: ${error.message || '알 수 없는 문제'}`);
      // Fallback to client-side itinerary generation on error
      if (dates) {
        console.warn("⚠️ 오류 발생으로 클라이언트 측 일정을 생성합니다 (useScheduleGenerationRunner).");
        try {
          const clientGeneratedItinerary: CreatorItineraryDay[] = createItinerary(
            selectedPlaces,
            dates.startDate,
            dates.endDate,
            dates.startTime,
            dates.endTime
          );
          const domainClientItinerary: DomainItineraryDay[] = clientGeneratedItinerary.map(day => ({
            ...day,
            places: day.places.map(p => ({...p, timeBlock: p.timeBlock || "시간 정보 없음"}) as ItineraryPlaceWithTime),
          }));
          setItinerary(domainClientItinerary);
          finalItineraryForEvent = domainClientItinerary;

          if (domainClientItinerary.length > 0) {
            setSelectedDay(domainClientItinerary[0].day);
            toast.info("클라이언트에서 기본 일정이 생성되었습니다. (오류 발생)");
          } else {
             toast.error("오류 발생 후 클라이언트에서도 일정을 생성하지 못했습니다.");
          }
        } catch (fallbackError: any) {
          console.error("❌ 클라이언트 측 일정 생성도 실패 (useScheduleGenerationRunner):", fallbackError);
          toast.error(`클라이언트 일정 생성 실패: ${fallbackError.message || '알 수 없는 문제'}`);
        }
      }
    } finally {
      console.log("🏁 일정 생성 프로세스 종료 (useScheduleGenerationRunner)");
      setIsLoadingState(false);
      
      // Dispatch event regardless of success, detail will indicate outcome
      console.log("Dispatching itineraryCreated event with (useScheduleGenerationRunner):", finalItineraryForEvent);
      const event = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: finalItineraryForEvent,
          selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null
        } 
      });
      window.dispatchEvent(event);

      // Final status logging
      setTimeout(() => {
        // Accessing state from hook closure, might not be latest if not re-evaluated.
        // For accurate final state, this log might be better placed where states are directly accessible after update.
        // However, for this structure, it shows state at the end of this specific execution.
        console.log("📊 최종 상태 확인 (useScheduleGenerationRunner - async end):", {
          // isLoading: isLoadingState, // This would be from props if passed back, not direct state here
          itineraryLength: finalItineraryForEvent.length, // Use what was processed
          selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null,
          hasServerResponse: !!lastServerResponse, // Shows if server call was made and responded
          hasError: !!lastError // Shows if an error was caught
        });
      }, 0);
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
    // lastServerResponse, lastError are not dependencies for useCallback itself
  ]);

  return { runScheduleGenerationProcess, lastServerResponse, lastError };
};
