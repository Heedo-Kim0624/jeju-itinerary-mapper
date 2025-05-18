
import { useCallback } from 'react';
import { toast } from 'sonner';
import { SelectedPlace } from '@/types/supabase';
// ItineraryDay type from use-itinerary (which is CreatorItineraryDay)
import { ItineraryDay as AppItineraryDay } from '@/hooks/use-itinerary'; 
import { NewServerScheduleResponse, ServerRouteResponse, isNewServerScheduleResponse } from '@/types/schedule';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
// Removed useItineraryCreator import as createItinerary (fallback) is now handled by useLeftPanel or similar
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useSchedulePayload } from './useSchedulePayload';
import { useScheduleParser, updateItineraryWithCoordinates } from './useScheduleParser';
// extractAllNodesFromRoute and extractAllLinksFromRoute are not needed here if parser handles it.

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
  // This setItinerary expects AppItineraryDay[] which is CreatorItineraryDay[]
  setItinerary: (itinerary: AppItineraryDay[]) => void; 
  setSelectedDay: (day: number | null) => void;
  setIsLoadingState: (loading: boolean) => void;
  // Add fallback itinerary creation function if needed
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
  createFallbackItinerary, // Optional fallback function
}: UseScheduleGenerationRunnerProps) => {
  const { generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook();
  const { setServerRoutes, geoJsonNodes } = useMapContext();
  
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  // Ensure currentSelectedPlaces passed to useScheduleParser has the fields needed by your new parser
  const { parseServerResponse } = useScheduleParser({ currentSelectedPlaces: selectedPlaces });

  // Your suggested debug itinerary function
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
      
      const placesForDay: AppItineraryDay['places'] = [];
      for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
        const placeIdNum = 4060000000 + i * 10000 + j * 100;
        placesForDay.push({
          id: String(placeIdNum), // Assuming AppItineraryDay place id is string
          name: `디버깅 장소 ${i+1}-${j+1}`,
          category: ['attraction', 'restaurant', 'cafe', 'accommodation'][j % 4] as any,
          x: 126.5 + (Math.random() * 0.5 - 0.25),
          y: 33.4 + (Math.random() * 0.5 - 0.25),
          address: '제주특별자치도',
          timeBlock: `${9 + j * 3}:00`,
          geoNodeId: String(placeIdNum) // Assuming geoNodeId is string
          // Ensure all required fields for AppItineraryDay['places'] items are here
        });
      }
      
      const nodeIdsNum = placesForDay.map(p => Number(p.id)); // Numbers for interleaved
      const linkIdsNum: number[] = [];
      for (let j = 0; j < nodeIdsNum.length - 1; j++) {
        linkIdsNum.push(5060000000 + i * 10000 + j * 100);
      }
      
      const interleavedRouteNum: number[] = [];
      for (let j = 0; j < nodeIdsNum.length; j++) {
        interleavedRouteNum.push(nodeIdsNum[j]);
        if (j < linkIdsNum.length) {
          interleavedRouteNum.push(linkIdsNum[j]);
        }
      }
      
      result.push({
        day: i + 1,
        dayOfWeek,
        date: dateStr,
        places: placesForDay,
        totalDistance: 10 + Math.random() * 20,
        interleaved_route: interleavedRouteNum, // number[]
        routeData: { // number[] as per ServerRouteResponse
          nodeIds: nodeIdsNum,
          linkIds: linkIdsNum
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

      const serverResponse = await generateScheduleViaHook(payload);
      debugLog('Raw server response (useScheduleGenerationRunner):', serverResponse);
      
      if (serverResponse && isNewServerScheduleResponse(serverResponse) && serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        try {
          let parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
          console.log("[useScheduleGenerationRunner] 파싱된 일정 (좌표 업데이트 전):", JSON.parse(JSON.stringify(parsedItinerary)));
          
          if (!parsedItinerary || parsedItinerary.length === 0) {
            console.error("[useScheduleGenerationRunner] 일정 파싱 실패 또는 빈 일정. 디버깅용 목업 생성 시도.");
            toast.error("일정 데이터를 처리할 수 없습니다.");
            // Use your suggested createDebugItinerary if parsing fails
            if (dates?.startDate) {
                 parsedItinerary = createDebugItineraryLocal(dates.startDate);
                 console.log("[useScheduleGenerationRunner] 디버깅용 목업 일정 생성:", parsedItinerary);
            }
            if (!parsedItinerary || parsedItinerary.length === 0) { // If still empty, truly fail
                setIsLoadingState(false);
                return;
            }
          }
          
          // The ItineraryDay from parseServerResponse needs to be compatible with AppItineraryDay for updateItineraryWithCoordinates and setItinerary
          const itineraryWithCoords = updateItineraryWithCoordinates(parsedItinerary as any, geoJsonNodes as any) as AppItineraryDay[];
          console.log("[useScheduleGenerationRunner] 좌표가 추가된 일정:", JSON.parse(JSON.stringify(itineraryWithCoords)));
          
          setItinerary(itineraryWithCoords);
          finalItineraryForEvent = itineraryWithCoords;
          
          const routesForMapContext: Record<number, ServerRouteResponse> = {};
          itineraryWithCoords.forEach(dayWithCoords => {
            // Ensure dayWithCoords.routeData.nodeIds/linkIds are number[] as expected by ServerRouteResponse
            if (dayWithCoords.routeData?.nodeIds && dayWithCoords.routeData?.linkIds) {
              routesForMapContext[dayWithCoords.day] = {
                nodeIds: dayWithCoords.routeData.nodeIds.map(id => Number(id)), // Ensure numbers if they became strings
                linkIds: dayWithCoords.routeData.linkIds.map(id => Number(id)), // Ensure numbers
                interleaved_route: dayWithCoords.interleaved_route,
              };
            }
          });
          
          debugLog("지도용 경로 데이터:", routesForMapContext);
          setServerRoutes(routesForMapContext);
          
          if (itineraryWithCoords.length > 0) {
            setSelectedDay(itineraryWithCoords[0].day);
            toast.success(`${itineraryWithCoords.length}일 일정이 성공적으로 생성되었습니다!`);
          } else {
            toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
          }
        } catch (error) {
          console.error("[useScheduleGenerationRunner] 일정 처리 중 오류:", error);
          toast.error("일정 데이터 처리 중 오류가 발생했습니다.");
          if (createFallbackItinerary) finalItineraryForEvent = createFallbackItinerary();
          setItinerary(finalItineraryForEvent);

        }
      } else {
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
        }
      }
    } catch (error) {
      console.error("일정 생성 중 최상위 오류 (useScheduleGenerationRunner):", error);
      toast.error("일정 생성 중 심각한 오류가 발생했습니다.");
      if (createFallbackItinerary) {
        finalItineraryForEvent = createFallbackItinerary();
        setItinerary(finalItineraryForEvent);
         if (finalItineraryForEvent.length > 0) setSelectedDay(finalItineraryForEvent[0].day);
      }
    } finally {
      debugLog("[useScheduleGenerationRunner] finally 블록 진입.");
      if (finalItineraryForEvent.length > 0) {
        debugLog("'itineraryCreated' 이벤트 발생 준비:", JSON.parse(JSON.stringify(finalItineraryForEvent)));
        const event = new CustomEvent('itineraryCreated', { 
          detail: { 
            itinerary: finalItineraryForEvent,
            selectedDay: finalItineraryForEvent.length > 0 ? finalItineraryForEvent[0].day : null
          } 
        });
        window.dispatchEvent(event);
        
        setTimeout(() => {
          debugLog("'forceRerender' and 'itineraryWithCoordinatesReady' 이벤트 발생");
          window.dispatchEvent(new Event('forceRerender'));
          const coordsEvent = new CustomEvent('itineraryWithCoordinatesReady', {
            detail: { itinerary: finalItineraryForEvent }
          });
          window.dispatchEvent(coordsEvent);
          setIsLoadingState(false);
        }, 200);
      } else {
        debugLog("'itineraryCreated' 이벤트 발생 (빈 일정)");
        window.dispatchEvent(new CustomEvent('itineraryCreated', { detail: { itinerary: [], selectedDay: null } }));
        setIsLoadingState(false); // Set loading to false even if itinerary is empty
      }
    }
  }, [
    preparePayload,
    generateScheduleViaHook,
    parseServerResponse,
    geoJsonNodes,
    // selectedPlaces, // parseServerResponse now gets it from its own closure
    dates,
    setServerRoutes,
    setItinerary,
    setSelectedDay,
    setIsLoadingState,
    createFallbackItinerary,
    // createDebugItineraryLocal // Not stable dependency
  ]);

  return { 
    runScheduleGenerationProcess,
  };
};
