import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace, ItineraryDay as AppItineraryDay, ItineraryPlaceWithTime, ServerRouteResponse, NewServerScheduleResponse, isNewServerScheduleResponse, Place } from '@/types'; // Updated imports
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser, updateItineraryWithCoordinates } from './useScheduleParser';

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
  setItinerary: (itinerary: AppItineraryDay[]) => void; 
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
  createFallbackItinerary?: () => AppItineraryDay[];
}

export const useScheduleGenerationRunner = ({
  selectedPlaces,
  dates,
  startDatetime, 
  endDatetime,   
  setItinerary,
  setSelectedDay,
  setIsLoadingState,
  createFallbackItinerary,
}: UseScheduleGenerationRunnerProps) => {
  const { generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook();
  const { setServerRoutes, geoJsonNodes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces as Place[] }); // Cast selectedPlaces to Place[]

  const createDebugItineraryLocal = (startDate: Date): AppItineraryDay[] => {
    const result: AppItineraryDay[] = [];
    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeekNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayOfWeek = dayOfWeekNames[currentDate.getDay()];
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const dateStr = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
      
      const placesForDay: ItineraryPlaceWithTime[] = [];
      for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
        const placeIdNum = 4060000000 + i * 10000 + j * 100;
        placesForDay.push({
          id: String(placeIdNum),
          name: `디버깅 장소 ${i+1}-${j+1}`,
          category: ['attraction', 'restaurant', 'cafe', 'accommodation'][j % 4] as any,
          x: 126.5 + (Math.random() * 0.5 - 0.25),
          y: 33.4 + (Math.random() * 0.5 - 0.25),
          address: '제주특별자치도',
          timeBlock: `${9 + j * 3}:00`,
          geoNodeId: String(placeIdNum),
          // Add missing required fields for ItineraryPlaceWithTime (which extends Place)
          phone: '',
          description: '',
          rating: 0,
          image_url: '',
          road_address: '',
          homepage: '',
        });
      }
      
      const nodeIdsNum = placesForDay.map(p => Number(p.id));
      const linkIdsNum: number[] = [];
      for (let k = 0; k < nodeIdsNum.length - 1; k++) { // iterator j was already used
        linkIdsNum.push(5060000000 + i * 10000 + k * 100);
      }
      
      const interleavedRouteNum: number[] = [];
      for (let k = 0; k < nodeIdsNum.length; k++) { // iterator j was already used
        interleavedRouteNum.push(nodeIdsNum[k]);
        if (k < linkIdsNum.length) {
          interleavedRouteNum.push(linkIdsNum[k]);
        }
      }
      
      result.push({
        day: i + 1,
        dayOfWeek,
        date: dateStr,
        places: placesForDay,
        totalDistance: 10 + Math.random() * 20,
        interleaved_route: interleavedRouteNum,
        routeData: { 
          nodeIds: nodeIdsNum.map(String), // Map to string as per RouteData type
          linkIds: linkIdsNum.map(String)  // Map to string
        }
      });
    }
    return result;
  };

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleGenerationRunner] runScheduleGenerationProcess started.");
    setIsLoadingState(true);
    
    let finalItineraryForEvent: AppItineraryDay[] = [];
    
    try {
      const payload = preparePayload();
      debugLog('Server request payload (useScheduleGenerationRunner):', payload);
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return;
      }

      const serverResponse: NewServerScheduleResponse | null = await generateScheduleViaHook(payload);
      debugLog('Raw server response (useScheduleGenerationRunner):', serverResponse);
      
      if (serverResponse && isNewServerScheduleResponse(serverResponse) && serverResponse.route_summary) { // Removed length check on route_summary to allow empty valid schedules
        try {
          let parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
          console.log("[useScheduleGenerationRunner] 파싱된 일정 (좌표 업데이트 전):", JSON.parse(JSON.stringify(parsedItinerary)));
          
          if (!parsedItinerary || parsedItinerary.length === 0) {
            // Only use debug itinerary if parsing results in absolutely nothing AND server did provide data
            if (serverResponse.schedule.length > 0 || serverResponse.route_summary.length > 0) {
                 console.warn("[useScheduleGenerationRunner] 일정 파싱 결과가 비었지만, 서버 데이터는 존재. 목업 생성 안함.");
                 // toast.error("일정 데이터를 처리할 수 없습니다. (파싱 후 빈 결과)");
                 // This case might indicate a successful empty schedule from server (e.g. no places fit)
                 // Or it could be a parser bug if server data was non-empty.
            } else {
                console.error("[useScheduleGenerationRunner] 일정 파싱 실패 또는 빈 일정. 디버깅용 목업 생성 시도.");
                // toast.error("일정 데이터를 처리할 수 없습니다."); // Redundant if createDebugItineraryLocal shows its own toasts
                 if (dates?.startDate) {
                     parsedItinerary = createDebugItineraryLocal(dates.startDate);
                     console.log("[useScheduleGenerationRunner] 디버깅용 목업 일정 생성:", parsedItinerary);
                     if (parsedItinerary.length === 0) toast.error("목업 일정 생성도 실패했습니다.");
                 }
            }
             // If still empty after potential debug generation, set empty and proceed to finally
            if (!parsedItinerary || parsedItinerary.length === 0) {
                setItinerary([]);
                finalItineraryForEvent = [];
                // No selected day if no itinerary
                // Consider a specific toast if it's an actual "no schedule could be made" vs "error"
                // toast.info("조건에 맞는 일정을 생성할 수 없었습니다."); // If applicable
                // The finally block will dispatch itineraryCreated with empty array
                // setIsLoadingState(false); // This will be handled in finally
                // return; // Proceed to finally block
            }
          }
          
          const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary, geoJsonNodes as any) as AppItineraryDay[];
          console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정:", JSON.parse(JSON.stringify(itineraryWithCoords)));
          
          setItinerary(itineraryWithCoords); // This now expects AppItineraryDay[]
          finalItineraryForEvent = itineraryWithCoords;
          
          const routesForMapContext: Record<number, ServerRouteResponse> = {};
          itineraryWithCoords.forEach(dayWithCoords => {
            if (dayWithCoords.routeData?.nodeIds && dayWithCoords.routeData?.linkIds) {
              routesForMapContext[dayWithCoords.day] = {
                // Convert back to number[] for ServerRouteResponse as map might expect numbers from original geojson
                nodeIds: dayWithCoords.routeData.nodeIds.map(id => Number(id)).filter(id => !isNaN(id)), 
                linkIds: dayWithCoords.routeData.linkIds.map(id => Number(id)).filter(id => !isNaN(id)), 
                interleaved_route: dayWithCoords.interleaved_route, // This is already number[]
              };
            }
          });
          
          debugLog("지도용 경로 데이터:", routesForMapContext);
          setServerRoutes(routesForMapContext);
          
          if (itineraryWithCoords.length > 0) {
            setSelectedDay(itineraryWithCoords[0].day);
            toast.success(`${itineraryWithCoords.length}일 일정이 성공적으로 생성되었습니다!`);
          } else {
            // This case means itineraryWithCoords is empty.
            // Could be due to parser returning empty, or server legitimately returning empty schedule.
            toast.info("생성된 일정이 없습니다."); // More neutral message
            setSelectedDay(null); // No day to select
          }
        } catch (error) {
          console.error("[useScheduleGenerationRunner] 일정 처리 중 오류:", error);
          toast.error("일정 데이터 처리 중 오류가 발생했습니다.");
          if (createFallbackItinerary) finalItineraryForEvent = createFallbackItinerary();
          else finalItineraryForEvent = [];
          setItinerary(finalItineraryForEvent);
        }
      } else {
        // ... keep existing code (fallback logic)
        console.warn('[useScheduleGenerationRunner] 서버 응답이 없거나 형식이 맞지 않습니다. Fallback 시도.', serverResponse);
        toast.error("서버 응답 형식이 올바르지 않습니다. 클라이언트 생성 시도.");
        if (createFallbackItinerary) {
            finalItineraryForEvent = createFallbackItinerary();
            setItinerary(finalItineraryForEvent);
            if (finalItineraryForEvent.length > 0) {
              setSelectedDay(finalItineraryForEvent[0].day);
              toast.info("클라이언트에서 기본 일정이 생성되었습니다.");
            } else {
              toast.error("클라이언트 일정 생성도 실패했습니다.");
            }
        } else {
            toast.error("대체 일정 생성 로직이 없습니다.");
            finalItineraryForEvent = []; // Ensure it's an empty array
            setItinerary([]); // Set to empty array
        }
      }
    } catch (error) {
      // ... keep existing code (error handling and fallback)
      console.error("일정 생성 중 최상위 오류 (useScheduleGenerationRunner):", error);
      toast.error("일정 생성 중 심각한 오류가 발생했습니다.");
      if (createFallbackItinerary) {
        finalItineraryForEvent = createFallbackItinerary();
         if (finalItineraryForEvent.length > 0) setSelectedDay(finalItineraryForEvent[0].day);
      } else {
        finalItineraryForEvent = [];
      }
      setItinerary(finalItineraryForEvent); // Set itinerary even in error case
    } finally {
      // ... keep existing code (finally block for dispatching events)
      debugLog("[useScheduleGenerationRunner] finally 블록 진입.");
      // Always dispatch itineraryCreated, even if finalItineraryForEvent is empty
      debugLog("'itineraryCreated' 이벤트 발생 준비:", JSON.parse(JSON.stringify(finalItineraryForEvent)));
      const event = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: finalItineraryForEvent, // This must be AppItineraryDay[]
          selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null
        } 
      });
      window.dispatchEvent(event);
      
      // Only dispatch these if there is an itinerary to show/render
      if (finalItineraryForEvent.length > 0) {
        setTimeout(() => {
          debugLog("'forceRerender' and 'itineraryWithCoordinatesReady' 이벤트 발생");
          window.dispatchEvent(new Event('forceRerender'));
          const coordsEvent = new CustomEvent('itineraryWithCoordinatesReady', {
            detail: { itinerary: finalItineraryForEvent } // This must be AppItineraryDay[]
          });
          window.dispatchEvent(coordsEvent);
          setIsLoadingState(false);
        }, 200);
      } else {
         // If no itinerary, just set loading to false. forceRerender might not be needed or could be harmful.
         setIsLoadingState(false);
      }
    }
  }, [
    preparePayload,
    generateScheduleViaHook,
    parseServerResponse,
    geoJsonNodes,
    dates,
    setServerRoutes,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
    createFallbackItinerary,
    // createDebugItineraryLocal removed from dependencies as it's a local const
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
