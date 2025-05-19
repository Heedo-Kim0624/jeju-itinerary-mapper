
import { useCallback } from 'react';
import { toast } from 'sonner';
import { 
  SelectedPlace, 
  NewServerScheduleResponse, 
  isNewServerScheduleResponse, 
  ServerRouteResponse, 
  ItineraryDay, 
  Place, 
  RouteData 
} from '@/types'; // Updated imports
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
// ItineraryDay from use-itinerary-creator is CreatorItineraryDay, which needs mapping
import { useItineraryCreator } from '@/hooks/use-itinerary-creator'; 
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser, updateItineraryWithCoordinates } from './useScheduleParser';

const DEBUG_MODE = true;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

// Helper functions for mapping CreatorItineraryDay to Global ItineraryDay
const getDayOfWeekString = (date: Date): string => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
};
const getDateStringMMDD = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const dayNum = date.getDate().toString().padStart(2, '0');
  return `${month}/${dayNum}`;
};

interface UseScheduleGenerationRunnerProps {
  selectedPlaces: SelectedPlace[]; // This uses SelectedPlace from @/types
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  setItinerary: (itinerary: ItineraryDay[]) => void; // Expects global ItineraryDay[]
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
  const { createItinerary: originalCreateItinerary } = useItineraryCreator(); // Renamed to avoid confusion
  const { setServerRoutes, geoJsonNodes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  const mapCreatorItineraryToGlobal = (
    creatorDays: ReturnType<typeof originalCreateItinerary>, 
    startDate: Date | null
  ): ItineraryDay[] => {
    if (!startDate) return [];
    return creatorDays.map((creatorDay, index) => {
      const currentDayDate = new Date(startDate);
      currentDayDate.setDate(startDate.getDate() + index);
      
      // Ensure we have a routeData object that meets the global RouteData type
      const routeData: RouteData = {
        nodeIds: (creatorDay.routeData?.nodeIds || []).map(String),
        linkIds: (creatorDay.routeData?.linkIds || []).map(String),
        segmentRoutes: creatorDay.routeData?.segmentRoutes || []
      };
      
      return {
        ...creatorDay,
        dayOfWeek: getDayOfWeekString(currentDayDate),
        date: getDateStringMMDD(currentDayDate),
        routeData: routeData, // Use the properly typed routeData
        interleaved_route: (creatorDay as any).interleaved_route || [], 
      };
    });
  };

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess started. Setting isLoadingState to true.");
    setIsLoadingState(true);
    
    let finalItineraryForEvent: ItineraryDay[] = []; // Ensure this is Global ItineraryDay[]
    let itineraryCreatedSuccessfully = false;
    
    try {
      const payload = preparePayload();
      debugLog('Server request payload (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log('[useScheduleGenerationRunner] 서버 원본 응답:', serverResponse);
      debugLog('Raw server response (useScheduleGenerationRunner):', serverResponse);
      
      console.log('[useScheduleGenerationRunner] 서버 응답 타입 분석:', {
        응답존재: !!serverResponse,
        객체타입: typeof serverResponse === 'object',
        배열여부: Array.isArray(serverResponse),
        schedule존재: !!serverResponse?.schedule,
        route_summary존재: !!serverResponse?.route_summary,
        isNewResponse: isNewServerScheduleResponse(serverResponse)
      });

      if (serverResponse && isNewServerScheduleResponse(serverResponse)) {
        console.log('[useScheduleGenerationRunner] 서버 응답이 유효합니다. 일정 파싱을 시작합니다.');
        
        // parseServerResponse should return ItineraryDay[] (global type)
        let parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
        console.log("[useScheduleGenerationRunner] 파싱된 일정 (좌표 업데이트 전):", JSON.parse(JSON.stringify(parsedItinerary)));
        
        if (parsedItinerary.length === 0) {
          console.error('[useScheduleGenerationRunner] 서버 응답 파싱 결과가 빈 배열입니다.');
          toast.error('서버 응답을 처리할 수 없습니다. 다시 시도해 주세요.');
          
          if (dates && selectedPlaces.length > 0) {
            const creatorFallbackItinerary = originalCreateItinerary(
              selectedPlaces as Place[], // Cast if SelectedPlace is too specific for createItinerary
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            const mappedFallbackItinerary = mapCreatorItineraryToGlobal(creatorFallbackItinerary, dates.startDate);
            
            if (mappedFallbackItinerary.length > 0) {
              setItinerary(mappedFallbackItinerary);
              finalItineraryForEvent = mappedFallbackItinerary;
              setSelectedDay(mappedFallbackItinerary[0].day);
              toast.info('클라이언트에서 대체 일정을 생성했습니다.');
              itineraryCreatedSuccessfully = true;
            }
          }
          return;
        }
        
        const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any);
        console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정:", JSON.parse(JSON.stringify(itineraryWithCoords)));
        
        setItinerary(itineraryWithCoords); // itineraryWithCoords should be ItineraryDay[]
        finalItineraryForEvent = itineraryWithCoords;
        
        setSelectedDay(itineraryWithCoords[0].day);
        
        const routesForMapContext: Record<number, ServerRouteResponse> = {};
        itineraryWithCoords.forEach(dayWithCoords => {
            // Ensure routeData exists and has nodeIds/linkIds as per new ServerRouteResponse
            // The interleaved_route in ServerRouteResponse from types/index.ts is number[]
            routesForMapContext[dayWithCoords.day] = {
                nodeIds: dayWithCoords.routeData?.nodeIds.map(id => Number(id)) || [], 
                linkIds: dayWithCoords.routeData?.linkIds.map(id => Number(id)) || [],
                interleaved_route: Array.isArray(dayWithCoords.interleaved_route) 
                    ? dayWithCoords.interleaved_route.map(id => typeof id === 'string' ? Number(id) : id).filter(id => typeof id === 'number') as number[]
                    : [],
            };
        });
        
        console.log("[useScheduleGenerationRunner] 지도 콘텍스트에 경로 데이터 설정:", routesForMapContext);
        setServerRoutes(routesForMapContext);
        
        if (itineraryWithCoords.length > 0) {
          toast.success(`${itineraryWithCoords.length}일 일정이 성공적으로 생성되었습니다!`);
          itineraryCreatedSuccessfully = true;
        }
      } else {
        console.error('[useScheduleGenerationRunner] 서버 응답이 필요한 형식을 충족하지 않거나 null입니다.:', serverResponse);
        
        if (dates && selectedPlaces.length > 0) {
            const creatorFallbackItinerary = originalCreateItinerary(
              selectedPlaces as Place[],
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            const mappedFallbackItinerary = mapCreatorItineraryToGlobal(creatorFallbackItinerary, dates.startDate);
            
            setItinerary(mappedFallbackItinerary);
            finalItineraryForEvent = mappedFallbackItinerary;
            
            if (mappedFallbackItinerary.length > 0) {
              setSelectedDay(mappedFallbackItinerary[0].day);
              toast.info("서버 응답 문제로 클라이언트에서 기본 일정이 생성되었습니다.");
              itineraryCreatedSuccessfully = true;
            } else {
              toast.error("대체 일정 생성에도 실패했습니다.");
            }
        } else {
           toast.error("서버 응답이 없어 대체 일정을 생성할 수 없습니다.");
        }
      }
    } catch (error) {
      console.error("일정 생성 중 오류 발생 (useScheduleGenerationRunner):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      
      if (dates && selectedPlaces.length > 0) {
        const creatorFallbackItinerary = originalCreateItinerary(
          selectedPlaces as Place[],
          dates.startDate,
          dates.endDate,
          dates.startTime,
          dates.endTime
        );
        const mappedFallbackItinerary = mapCreatorItineraryToGlobal(creatorFallbackItinerary, dates.startDate);
        
        setItinerary(mappedFallbackItinerary);
        finalItineraryForEvent = mappedFallbackItinerary;
        
        if (mappedFallbackItinerary.length > 0) {
          setSelectedDay(mappedFallbackItinerary[0].day);
          toast.info("오류 발생으로 인해 기본 일정을 생성했습니다.");
          itineraryCreatedSuccessfully = true;
        }
      }
    } finally {
      console.log("[useScheduleGenerationRunner] finally 블록 진입.");
      
      const showItineraryStateForEvent = itineraryCreatedSuccessfully && finalItineraryForEvent.length > 0;

      console.log(`[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생 준비: showItinerary=${showItineraryStateForEvent}`);
      const event = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: finalItineraryForEvent, // This is now correctly typed ItineraryDay[]
          selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null,
          showItinerary: showItineraryStateForEvent // Crucial: pass the showItinerary state
        } 
      });
      window.dispatchEvent(event);
      console.log("[useScheduleGenerationRunner] 'itineraryCreated' 이벤트 발생 완료.");
      
      setTimeout(() => {
        setIsLoadingState(false);
        console.log("[useScheduleGenerationRunner] isLoadingState를 false로 설정 (지연 후).");
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
    originalCreateItinerary, 
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
    mapCreatorItineraryToGlobal, 
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
