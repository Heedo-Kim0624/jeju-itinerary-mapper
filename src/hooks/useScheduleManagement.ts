
import { useState, useCallback, useEffect, ReactNode } from 'react';
import { Place, SelectedPlace, ItineraryDay as DomainItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/supabase'; 
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
// ServerRouteResponse is now expected by MapContext, ServerRouteSummaryItem is from server
import { SchedulePayload, NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem, ServerRouteResponse, isNewServerScheduleResponse } from '@/types/schedule'; 
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

type ItineraryDay = DomainItineraryDay;

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetimeISO: string | null; 
  endDatetimeISO: string | null;   
}

// 디버깅 모드 플래그 및 로그 함수 추가
const DEBUG_MODE = true; // 개발 중 true, 배포 시 false로 변경 권장

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    // 콘솔에 더 잘 보이도록 스타일 추가 가능
    console.log(`[DEBUG] %c${message}`, 'color: blue; font-weight: bold;', data !== undefined ? data : '');
  }
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetimeISO, 
  endDatetimeISO,   
}: UseScheduleManagementProps) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true); // Changed from false to true for initial loading

  const { createItinerary } = useItineraryCreator();
  const { generateSchedule: generateScheduleViaHook, isGenerating: isServerGenerating } = useScheduleGeneratorHook();
  const { setServerRoutes, clearAllRoutes, renderGeoJsonRoute } = useMapContext(); 

  const preparePayload = useCallback((): SchedulePayload | null => {
    if (!startDatetimeISO || !endDatetimeISO) {
      return null;
    }
    
    const directlySelectedPlaces = selectedPlaces.filter(p => !p.isCandidate);
    const autoCompletedPlaces = selectedPlaces.filter(p => p.isCandidate);
    
    const selectedPlacesPayload = directlySelectedPlaces.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, 
      name: p.name || 'Unknown Place' 
    }));
    
    const candidatePlacesPayload = autoCompletedPlaces.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, 
      name: p.name || 'Unknown Place' 
    }));
        
    const payload: SchedulePayload = {
      selected_places: selectedPlacesPayload,
      candidate_places: candidatePlacesPayload,
      start_datetime: startDatetimeISO, 
      end_datetime: endDatetimeISO    
    };
    
    console.log("📤 서버 요청 payload (from useScheduleManagement):", JSON.stringify(payload, null, 2));
    return payload;
  }, [selectedPlaces, startDatetimeISO, endDatetimeISO]);

  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse, // Expect NewServerScheduleResponse
    currentSelectedPlaces: SelectedPlace[],
    tripStartDate: Date | null 
  ): ItineraryDay[] => {
    if (!tripStartDate) {
      console.error("Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    // response.schedule is ServerScheduleItem[]
    const allServerPlaces: ItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p => 
        (item.id !== undefined && String(p.id) === String(item.id)) || p.name === item.place_name
      );
      if (existingPlace) {
        return {
          ...existingPlace,
          category: item.place_type as CategoryName, 
          timeBlock: item.time_block,
        };
      }
      return {
        id: item.id?.toString() || item.place_name,
        name: item.place_name,
        category: item.place_type as CategoryName,
        timeBlock: item.time_block,
        x: 0, y: 0, address: '', phone: '', description: '', rating: 0,
        image_url: '', road_address: '', homepage: '',
        isSelected: false, isCandidate: false,
      } as ItineraryPlaceWithTime;
    });
    
    // response.route_summary is ServerRouteSummaryItem[]
    return response.route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayOfWeekString = summaryItem.day.substring(0, 3); // "Mon", "Tue", etc.
      const routeDayOfWeek = dayOfWeekMap[routeDayOfWeekString];
      let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
      if (tripDayNumber <= 0) {
        tripDayNumber += 7;
      }
      
      const placeNodeIdsInRoute = summaryItem.interleaved_route
        .filter((id, index) => index % 2 === 0) 
        .map(String); 

      const dayPlaces = allServerPlaces.filter(p => {
        const pIdStr = String(p.id);
        return placeNodeIdsInRoute.includes(pIdStr);
      });

      return {
        day: tripDayNumber,
        places: dayPlaces, // Use filtered places. If empty, means no matching places for this day's route nodes.
        totalDistance: summaryItem.total_distance_m / 1000, 
        interleaved_route: summaryItem.interleaved_route,
        routeData: { 
          nodeIds: placeNodeIdsInRoute,
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        }
      };
    });
  }, [selectedPlaces]); 

  const runScheduleGenerationProcess = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const payload = preparePayload();
      debugLog('서버 요청 페이로드 (useScheduleManagement):', payload); // 디버그 로그 추가
      
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return; 
      }

      const serverResponse = await generateScheduleViaHook(payload); // Returns NewServerScheduleResponse | null
      debugLog('서버 원본 응답 (useScheduleManagement):', serverResponse); // 디버그 로그 추가
      
      debugLog('서버 응답 타입 검사 (useScheduleManagement):', { // 디버그 로그 추가
        isNull: serverResponse === null,
        isObject: typeof serverResponse === 'object',
        isArray: Array.isArray(serverResponse),
        hasSchedule: !!serverResponse?.schedule,
        hasRouteSummary: !!serverResponse?.route_summary,
        isNewServerScheduleResponse: isNewServerScheduleResponse(serverResponse)
      });

      if (serverResponse && isNewServerScheduleResponse(serverResponse) && 
          serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces, dates?.startDate || new Date());
        setItinerary(parsedItinerary);
        
        // serverResponse.route_summary is guaranteed by isNewServerScheduleResponse and the length check
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
          // This case might occur if parseServerResponse results in an empty itinerary
          // toast.warn에서 toast.error로 변경
          toast.error("서버에서 경로를 받았으나, 일정에 포함할 장소 정보가 부족합니다.");
        }
      } else {
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다.");
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성 시도합니다 (useScheduleManagement).");
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
      console.error("일정 생성 오류 (useScheduleManagement):", error);
      toast.error("⚠️ 일정 생성 중 오류가 발생했습니다.");
      if (dates) { 
        console.warn("오류 발생으로 클라이언트 측 일정을 생성합니다 (useScheduleManagement).");
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
    clearAllRoutes, 
    renderGeoJsonRoute 
  ]);

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
  }, []);

  useEffect(() => {
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearAllRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route) {
        clearAllRoutes(); 
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        console.log(`Rendering day ${selectedDay} with ${nodes.length} nodes and ${links.length} links from interleaved_route.`);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
      } else if (currentDayData) {
        console.log(`Day ${selectedDay} does not have interleaved_route. Standard rendering or fallback needed.`);
      }
    }
  }, [selectedDay, itinerary, renderGeoJsonRoute, clearAllRoutes]);

  return {
    itinerary,
    selectedDay,
    isLoading: isLoadingState || isServerGenerating,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
