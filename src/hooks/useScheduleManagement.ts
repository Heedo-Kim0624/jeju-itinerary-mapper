
import { useState, useCallback, useEffect } from 'react';
import { Place, SelectedPlace, ItineraryDay as DomainItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/supabase'; // CategoryName 추가
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
// ServerRouteResponse -> ServerRouteSummaryItem, SchedulePayload, NewServerScheduleResponse로 변경
import { SchedulePayload, NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule'; 
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

type ItineraryDay = DomainItineraryDay;

interface UseScheduleManagementProps {
  selectedPlaces: SelectedPlace[];
  dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; } | null;
  startDatetimeISO: string | null; // 이제 로컬 타임존 문자열 (YYYY-MM-DDTHH:mm:ss)
  endDatetimeISO: string | null;   // 이제 로컬 타임존 문자열 (YYYY-MM-DDTHH:mm:ss)
}

export const useScheduleManagement = ({
  selectedPlaces,
  dates,
  startDatetimeISO, // 이 값은 이제 로컬 시간 기준 문자열
  endDatetimeISO,   // 이 값은 이제 로컬 시간 기준 문자열
}: UseScheduleManagementProps) => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(true); 

  const { createItinerary } = useItineraryCreator();
  const { generateSchedule: generateScheduleViaHook, isGenerating: isServerGenerating } = useScheduleGeneratorHook();
  const { setServerRoutes, clearAllRoutes, renderGeoJsonRoute } = useMapContext(); // clearMapRoutes -> clearAllRoutes

  const preparePayload = useCallback((): SchedulePayload | null => {
    if (!startDatetimeISO || !endDatetimeISO) {
      // toast는 호출하는 컴포넌트 (ScheduleGenerator)에서 처리
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
      start_datetime: startDatetimeISO, // 로컬 시간 기준 문자열 사용
      end_datetime: endDatetimeISO    // 로컬 시간 기준 문자열 사용
    };
    
    console.log("📤 서버 요청 payload (from useScheduleManagement):", JSON.stringify(payload, null, 2));
    return payload;
  }, [selectedPlaces, startDatetimeISO, endDatetimeISO]);

  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse, 
    currentSelectedPlaces: SelectedPlace[],
    tripStartDate: Date | null // 여행 시작일 추가
  ): ItineraryDay[] => {
    if (!tripStartDate) {
      console.error("Trip start date is required to parse server response days.");
      return [];
    }

    // 요일 문자열을 숫자(0-6, Sun-Sat)로 매핑
    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    // 서버의 'schedule' (장소 목록)을 Place 객체로 변환 (ID 기반 매칭 시도)
    const allServerPlaces: ItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p => p.id === item.id?.toString() || p.name === item.place_name);
      if (existingPlace) {
        return {
          ...existingPlace,
          category: item.place_type as CategoryName, // 직접 캐스팅 (서버 문자열이 CategoryName과 일치 가정)
          timeBlock: item.time_block,
        };
      }
      // fallback if not found
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
    
    // route_summary를 기반으로 ItineraryDay[] 생성
    return response.route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayOfWeek = dayOfWeekMap[summaryItem.day.substring(0, 3).charAt(0).toUpperCase() + summaryItem.day.substring(1,3).toLowerCase()];
      let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
      if (tripDayNumber <= 0) {
        tripDayNumber += 7;
      }

      // 해당 날짜의 장소를 interleaved_route에서 추출하거나, allServerPlaces에서 필터링 (여기서는 간단히 allServerPlaces 사용)
      // 실제로는 interleaved_route의 노드 ID와 allServerPlaces의 장소 ID를 매칭해야 함
      const dayPlaces = allServerPlaces.filter(p => {
        // TODO: 더 정확한 로직 필요: interleaved_route의 장소 노드 ID와 p.geoNodeId 또는 p.id를 비교
        // 임시로, 모든 장소를 모든 날에 표시 (실제 앱에서는 수정 필요)
        return true; 
      });

      return {
        day: tripDayNumber,
        places: dayPlaces, // TODO: 해당 날짜의 장소만 필터링해야 함
        totalDistance: summaryItem.total_distance_m / 1000, // km 단위로 변환
        interleaved_route: summaryItem.interleaved_route,
        // routeData는 interleaved_route로 대체되거나 함께 사용
        routeData: {
          nodeIds: extractAllNodesFromRoute(summaryItem.interleaved_route).map(String),
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        }
        // originalDayString 제거
      };
    });
  }, [createItinerary]); // dates 제거, selectedPlaces 추가 (allServerPlaces 매칭용)

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
        // parseServerResponse에 tripStartDate 전달 (dates?.startDate 사용)
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces, dates?.startDate || new Date());
        setItinerary(parsedItinerary);
        
        if (serverResponse.route_summary) {
            const routesDataForContext: Record<number, ServerRouteSummaryItem> = {};
            const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
            const tripStartDayOfWeek = (dates?.startDate || new Date()).getDay();

            serverResponse.route_summary.forEach(summaryItem => {
                const routeDayOfWeek = dayOfWeekMap[summaryItem.day.substring(0, 3).charAt(0).toUpperCase() + summaryItem.day.substring(1,3).toLowerCase()];
                let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
                if (tripDayNumber <= 0) tripDayNumber += 7;
                routesDataForContext[tripDayNumber] = summaryItem;
            });
            setServerRoutes(routesDataForContext);
        }
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day as number); // day가 number임을 확신
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
        } else {
          toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
        }
      } else {
        toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다.");
        console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 일정을 생성 시도합니다 (실패 처리).");
        // 클라이언트 폴백 로직은 새로운 서버 스펙에서는 의미가 없을 수 있으므로, 오류 처리 강화
        if (dates) { // 클라이언트 폴백 로직 (기존 유지)
             const generatedItinerary: CreatorItineraryDay[] = createItinerary(
              selectedPlaces, // currentSelectedPlaces -> selectedPlaces
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
      if (dates) { // 클라이언트 폴백 로직 (기존 유지)
        console.warn("오류 발생으로 클라이언트 측 일정을 생성합니다 (useScheduleManagement).");
        const generatedItinerary: CreatorItineraryDay[] = createItinerary(
          selectedPlaces, // currentSelectedPlaces -> selectedPlaces
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
    clearAllRoutes, // 의존성 추가
    renderGeoJsonRoute // 의존성 추가
  ]);

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
    // 선택된 날짜의 경로를 지도에 다시 그리도록 MapContext에 알릴 수 있음
    // 예: clearMapRoutes(); renderDayRoute(day);
    // 실제 렌더링은 MapMarkers 또는 useMapFeatures에서 selectedDay 변경을 감지하여 처리
  }, []);

  // useEffect to update map when selectedDay or itinerary changes
  useEffect(() => {
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearAllRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route) {
        clearAllRoutes(); // 이전 경로 지우기
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        console.log(`Rendering day ${selectedDay} with ${nodes.length} nodes and ${links.length} links from interleaved_route.`);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
      } else if (currentDayData) {
        console.log(`Day ${selectedDay} does not have interleaved_route. Standard rendering or fallback needed.`);
        // 기존 renderItineraryRoute 호출 또는 다른 방식으로 지도에 표시
        // clearAllRoutes(); // 필요시 이전 경로 정리
        // if (currentDayData.routeData?.nodeIds && currentDayData.routeData?.linkIds) {
        //   renderGeoJsonRoute(currentDayData.routeData.nodeIds, currentDayData.routeData.linkIds, { strokeColor: '#FF6633', strokeWeight: 4 });
        // }
      }
    } else if (selectedDay === null || itinerary.length === 0) {
        // clearAllRoutes(); // 일정이 없거나 선택된 날이 없으면 경로를 지움
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
