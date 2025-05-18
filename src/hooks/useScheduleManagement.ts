
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useScheduleStateAndEffects } from './schedule/useScheduleStateAndEffects';
// import { useScheduleGenerationRunner } from './schedule/useScheduleGenerationRunner'; // No longer directly used for runScheduleGenerationProcess
import { SelectedPlace, ItineraryDay as SupabaseItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/supabase';
import { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem, ServerRouteResponse } from '@/types/schedule';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useSchedulePayload } from './schedule/useSchedulePayload'; // Added import
import { useMapContext } from '@/components/rightpanel/MapContext'; // Added import
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser'; // Added import

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetime: string | null;
  endDatetime: string | null;
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetime,
  endDatetime,
}: UseScheduleManagementProps) => {
  const {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState: isLoadingStateFromEffects,
    setIsLoadingState,
    handleSelectDay,
  } = useScheduleStateAndEffects();

  const { isGenerating: isGeneratingFromGenerator, generateSchedule: generateScheduleViaHook } = useScheduleGeneratorHook();
  const { preparePayload } = useSchedulePayload({ 
    selectedPlaces, 
    startDatetimeISO: startDatetime, 
    endDatetimeISO: endDatetime 
  });
  const { setServerRoutes } = useMapContext();
  
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  useEffect(() => {
    console.log(`[useScheduleManagement] Loading state changed:
      - isGeneratingFromGenerator: ${isGeneratingFromGenerator}
      - isLoadingStateFromEffects: ${isLoadingStateFromEffects}
      - Combined isLoading for UI: ${isGeneratingFromGenerator || isLoadingStateFromEffects}`);
  }, [isGeneratingFromGenerator, isLoadingStateFromEffects]);

  const combinedIsLoading = isGeneratingFromGenerator || isLoadingStateFromEffects;

  useEffect(() => {
    console.log(`[useScheduleManagement] Force rendering after loading state change: ${combinedIsLoading}`);
    setRenderTrigger(prev => prev + 1);
  }, [combinedIsLoading]);

  useEffect(() => {
    if (itinerary.length > 0) {
      console.log(`[useScheduleManagement] Itinerary received (${itinerary.length} days), triggering render`);
      setRenderTrigger(prev => prev + 1);
    }
  }, [itinerary]);

  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse, 
    // currentSelectedPlaces prop removed as selectedPlaces is available in scope
    tripStartDate: Date | null 
  ): SupabaseItineraryDay[] => { // Ensuring return type matches setItinerary
    if (!tripStartDate) {
      console.error("[useScheduleManagement-parseServerResponse] Trip start date is required to parse server response days.");
      return [];
    }

    console.log("[useScheduleManagement-parseServerResponse] 서버 응답 파싱 시작:", {
      schedule_항목수: response.schedule?.length || 0,
      route_summary_항목수: response.route_summary?.length || 0
    });

    if (!response.schedule || !response.route_summary || response.route_summary.length === 0) {
      console.error("[useScheduleManagement-parseServerResponse] 서버 응답에 필수 데이터가 누락되었습니다.");
      return [];
    }

    // const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    // const tripStartDayOfWeek = tripStartDate.getDay(); // Not used if day is index + 1

    const allServerPlaces: ItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = selectedPlaces.find(p => 
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
        isSelected: false, isCandidate: false, // Ensure these defaults from SelectedPlace/Place
      } as ItineraryPlaceWithTime;
    });

    console.log("[useScheduleManagement-parseServerResponse] 서버 장소 데이터 매핑 완료:", {
      총장소수: allServerPlaces.length,
      첫번째장소: allServerPlaces[0]?.name || '없음'
    });

    const parsedItineraryResult = response.route_summary.map((summaryItem: ServerRouteSummaryItem, index: number): SupabaseItineraryDay => {
      const tripDayNumber = index + 1;
      
      console.log(`[useScheduleManagement-parseServerResponse] ${index+1}일차 데이터 파싱:`, {
        원본요일: summaryItem.day,
        설정된day값: tripDayNumber,
        interleaved_route길이: summaryItem.interleaved_route?.length || 0
      });

      const placeNodeIdsInRoute = extractAllNodesFromRoute(summaryItem.interleaved_route).map(String);

      const dayPlaces = allServerPlaces.filter(p => {
        const pIdStr = String(p.id);
        return placeNodeIdsInRoute.includes(pIdStr);
      });
      
      // Ensure places match the expected structure for SupabaseItineraryDay
      const placesToUse: ItineraryPlaceWithTime[] = dayPlaces.length > 0 ? dayPlaces : allServerPlaces.filter(p => placeNodeIdsInRoute.includes(String(p.id))); // Ensure allServerPlaces are filtered if dayPlaces is empty
      
      console.log(`[useScheduleManagement-parseServerResponse] ${tripDayNumber}일차 장소 매핑 결과:`, {
        매핑된장소수: placesToUse.length,
        첫번째장소: placesToUse[0]?.name || '없음'
      });

      return {
        day: tripDayNumber,
        places: placesToUse, // This should be ItineraryPlaceWithTime[]
        totalDistance: summaryItem.total_distance_m / 1000, 
        interleaved_route: summaryItem.interleaved_route,
        routeData: {
          nodeIds: placeNodeIdsInRoute, // already extracted
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        }
      };
    });

    console.log("[useScheduleManagement-parseServerResponse] 일정 파싱 완료:", {
      총일수: parsedItineraryResult.length,
      일자목록: parsedItineraryResult.map(day => day.day),
      첫날장소수: parsedItineraryResult[0]?.places.length || 0
    });

    return parsedItineraryResult;
  }, [selectedPlaces, dates?.startDate]); // Added dates?.startDate

  const runScheduleGenerationProcess = useCallback(async () => {
    console.log("[useScheduleManagement] 일정 생성 프로세스 시작 (명시적 로딩 상태 관리)");
    setIsLoadingState(true); 
    
    try {
      const payload = preparePayload();
      if (!payload) {
        toast.error("일정 생성에 필요한 정보가 부족합니다.");
        setIsLoadingState(false);
        return false; 
      }

      console.log("[useScheduleManagement] 서버에 일정 생성 요청. Payload:", payload);
      const serverResponse = await generateScheduleViaHook(payload);
      console.log("[useScheduleManagement] 서버 응답 수신:", serverResponse);

      if (serverResponse && serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        const parsedItinerary = parseServerResponse(serverResponse, dates?.startDate || new Date());
        
        if (parsedItinerary.length === 0) {
          console.error("[useScheduleManagement] 일정 데이터 파싱 결과가 비어있습니다.");
          toast.error("⚠️ 일정 데이터를 생성할 수 없습니다.");
          setIsLoadingState(false); // Ensure loading state is turned off
          return false;
        }
        
        console.log("[useScheduleManagement] 일정 데이터 상태 업데이트:", {
          일수: parsedItinerary.length,
          첫날장소수: parsedItinerary[0]?.places.length || 0
        });
        setItinerary(parsedItinerary);
        
        if (serverResponse.route_summary) {
          const routesForMapContext: Record<number, ServerRouteResponse> = {};
          serverResponse.route_summary.forEach((summaryItem, index) => {
              const tripDayNumber = index + 1; // Use index + 1 for day consistency
              routesForMapContext[tripDayNumber] = {
                  nodeIds: extractAllNodesFromRoute(summaryItem.interleaved_route).map(String),
                  linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
                  interleaved_route: summaryItem.interleaved_route,
              };
          });
          console.log("[useScheduleManagement] 지도 라우트 데이터 설정:", routesForMapContext);
          setServerRoutes(routesForMapContext);
        }
        
        if (parsedItinerary.length > 0 && parsedItinerary[0].day != null) {
          const firstDay = parsedItinerary[0].day as number;
          console.log(`[useScheduleManagement] 첫 번째 날짜(${firstDay}) 선택`);
          setSelectedDay(firstDay);
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");

          // Dispatch itineraryCreated event
          const event = new CustomEvent('itineraryCreated', { 
            detail: { 
              itinerary: parsedItinerary,
              selectedDay: firstDay,
              success: true
            } 
          });
          window.dispatchEvent(event);

          return true;
        } else {
          toast.error("⚠️ 생성된 일정에 유효한 날짜 정보가 없습니다.");
          const event = new CustomEvent('itineraryCreated', { detail: { itinerary: parsedItinerary, selectedDay: null, success: false } });
          window.dispatchEvent(event);
          return false;
        }
      } else {
        toast.error("⚠️ 서버 응답이 없거나, 경로 정보가 부족하여 일정을 생성하지 못했습니다.");
         // Dispatch itineraryCreated event for failure
        const event = new CustomEvent('itineraryCreated', { detail: { itinerary: [], selectedDay: null, success: false } });
        window.dispatchEvent(event);
        return false;
      }
    } catch (error) {
      console.error("[useScheduleManagement] 일정 생성 중 오류 발생:", error);
      toast.error("일정 생성 중 오류가 발생했습니다");
      // Dispatch itineraryCreated event for error
      const event = new CustomEvent('itineraryCreated', { detail: { itinerary: [], selectedDay: null, success: false } });
      window.dispatchEvent(event);
      return false;
    } finally {
      console.log("[useScheduleManagement] 일정 생성 프로세스 완료, 로딩 상태 해제");
      setIsLoadingState(false); // 명시적 로딩 해제
       // 강제 리렌더링을 위한 이벤트 발생 (100ms 지연) - If needed, but event should trigger updates
      setTimeout(() => {
        console.log("[useScheduleManagement] 강제 리렌더링 이벤트 발생 (finally)");
        const forceEvent = new Event('forceRerender');
        window.dispatchEvent(forceEvent);
      }, 100);
    }
  }, [
    preparePayload, 
    generateScheduleViaHook, 
    parseServerResponse, 
    dates, 
    setItinerary, 
    setSelectedDay, 
    setIsLoadingState, 
    setServerRoutes,
    // selectedPlaces // already dependency of parseServerResponse indirectly
  ]);

  console.log(`[useScheduleManagement] Render with state:
    - renderTrigger: ${renderTrigger}
    - isGenerating: ${isGeneratingFromGenerator}
    - isLoadingState: ${isLoadingStateFromEffects}
    - Combined isLoading: ${combinedIsLoading}
    - Itinerary length: ${itinerary.length}
    - Selected Day: ${selectedDay}`);

  return {
    itinerary,
    selectedDay,
    isLoading: combinedIsLoading,
    handleSelectDay,
    runScheduleGenerationProcess,
    renderTrigger,
  };
};
