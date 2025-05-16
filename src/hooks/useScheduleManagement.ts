import { useState, useCallback, useEffect } from 'react';
import { Place, SelectedPlace, ItineraryDay as DomainItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/supabase'; 
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
// ServerRouteResponse is now expected by MapContext, ServerRouteSummaryItem is from server
import { SchedulePayload, NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem, ServerRouteResponse } from '@/types/schedule'; 
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

type ItineraryDay = DomainItineraryDay;

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetimeISO: string | null; 
  endDatetimeISO: string | null;   
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetimeISO, 
  endDatetimeISO,   
}: UseScheduleManagementProps) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true); 

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
    response: NewServerScheduleResponse, 
    currentSelectedPlaces: SelectedPlace[],
    tripStartDate: Date | null 
  ): ItineraryDay[] => {
    if (!tripStartDate) {
      console.error("Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    const allServerPlaces: ItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p => p.id === item.id?.toString() || p.name === item.place_name);
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
    
    return response.route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayOfWeek = dayOfWeekMap[summaryItem.day.substring(0, 3).charAt(0).toUpperCase() + summaryItem.day.substring(1,3).toLowerCase()];
      let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
      if (tripDayNumber <= 0) {
        tripDayNumber += 7;
      }

      // Filter places based on the current day's interleaved_route
      // This requires knowing which node IDs in interleaved_route correspond to places
      // For now, we'll assume allServerPlaces are generally for the trip, and specific day assignment needs more logic
      // or that the `schedule` part of the server response is already day-specific if applicable.
      // If not, we might need to match place IDs from interleaved_route to allServerPlaces.
      // Let's make a simple filter for places that might appear in this day's route summary (if IDs are available)
      // This part is complex and depends on how server guarantees place_id in schedule vs node_id in route.
      
      // For now, let's extract place IDs from the interleaved_route for this day
      const placeNodeIdsInRoute = summaryItem.interleaved_route
        .filter((id, index) => index % 2 === 0) // Nodes are at even indices
        .map(String); 

      const dayPlaces = allServerPlaces.filter(p => {
        // Match based on place ID. Need to ensure server place IDs and client place IDs are consistent.
        // Or, if server 'schedule' items don't have IDs that match node_ids, this filtering is difficult.
        // Assuming for now that a place's ID (if numeric) can be found in placeNodeIdsInRoute.
        const pIdStr = String(p.id);
        return placeNodeIdsInRoute.includes(pIdStr);
        // If server provides place names in interleaved_route or a mapping, that could be used.
        // As a fallback if above is too strict or IDs don't match:
        // return true; // to include all places in all days if filtering is problematic
      });

      return {
        day: tripDayNumber,
        places: dayPlaces.length > 0 ? dayPlaces : allServerPlaces, // Fallback to allServerPlaces if specific day filtering yields none (temporary)
        totalDistance: summaryItem.total_distance_m / 1000, 
        interleaved_route: summaryItem.interleaved_route,
        routeData: { // This is for client-side rendering if needed, derived from interleaved_route
          nodeIds: extractAllNodesFromRoute(summaryItem.interleaved_route).map(String),
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        }
      };
    });
  }, [selectedPlaces]); // Removed createItinerary as it's not used here, added selectedPlaces

  const runScheduleGenerationProcess = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const payload = preparePayload();
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return; 
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log("🔍 서버 응답 (raw, from useScheduleManagement):", serverResponse);

      if (serverResponse && serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces, dates?.startDate || new Date());
        setItinerary(parsedItinerary);
        
        if (serverResponse.route_summary) {
            // Convert ServerRouteSummaryItem to ServerRouteResponse for MapContext
            const routesForMapContext: Record<number, ServerRouteResponse> = {};
            const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
            const tripStartDayOfWeek = (dates?.startDate || new Date()).getDay();

            serverResponse.route_summary.forEach(summaryItem => {
                const routeDayOfWeek = dayOfWeekMap[summaryItem.day.substring(0, 3).charAt(0).toUpperCase() + summaryItem.day.substring(1,3).toLowerCase()];
                let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
                if (tripDayNumber <= 0) tripDayNumber += 7;

                routesForMapContext[tripDayNumber] = {
                    nodeIds: extractAllNodesFromRoute(summaryItem.interleaved_route).map(String),
                    linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
                    interleaved_route: summaryItem.interleaved_route, // Pass this along as it's part of ServerRouteResponse
                };
            });
            setServerRoutes(routesForMapContext); // Pass the converted data
        }
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day as number); 
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
        } else {
          toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
        }
      } else {
        toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성 시도합니다 (실패 처리).");
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
            toast.info("클라이언트에서 기본 일정이 생성되었습니다. (서버 데이터 없음)");
        }
      }
    } catch (error) {
      console.error("일정 생성 오류 (useScheduleManagement):", error);
      toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
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
