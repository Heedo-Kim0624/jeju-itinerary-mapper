
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
  setItinerary: (itinerary: CreatorItineraryDay[]) => void;
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

  const runScheduleGenerationProcess = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const payload = preparePayload();
      debugLog('서버 요청 페이로드 (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
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
        setItinerary(parsedItinerary);
        
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
        setServerRoutes(routesForMapContext);
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day as number);
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
        } else {
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
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
            const domainItinerary = generatedItinerary.map(day => ({
                ...day,
                places: day.places.map(p => ({...p, timeBlock: "시간 정보 없음"}) as ItineraryPlaceWithTime),
            }));
            setItinerary(domainItinerary);

            if (domainItinerary.length > 0) {
              setSelectedDay(domainItinerary[0].day);
            }
            toast.info("클라이언트에서 기본 일정이 생성되었습니다. (서버 응답 부족)");
        }
      }
    } catch (error) {
      console.error("일정 생성 오류 (useScheduleGenerationRunner):", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      if (dates) {
        console.warn("오류 발생으로 클라이언트 측 일정을 생성합니다 (useScheduleGenerationRunner).");
        const generatedItinerary: CreatorItineraryDay[] = createItinerary(
          selectedPlaces,
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        const domainItinerary = generatedItinerary.map(day => ({
            ...day,
            places: day.places.map(p => ({...p, timeBlock: "시간 정보 없음"}) as ItineraryPlaceWithTime),
        }));
        setItinerary(domainItinerary);
        if (domainItinerary.length > 0) {
          setSelectedDay(domainItinerary[0].day);
        }
      }
    } finally {
      setIsLoadingState(false);
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

  return { runScheduleGenerationProcess };
};
