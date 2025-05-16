import { useState, useCallback, useEffect } from 'react';
import { SelectedPlace, ItineraryDay as DomainItineraryDay, ItineraryPlaceWithTime, Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from '@/hooks/use-itinerary-creator';
import { useScheduleGenerator as useScheduleGeneratorHook } from '@/hooks/use-schedule-generator';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { SchedulePayload, ServerScheduleResponse as ServerResponseType, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { CategoryName, mapCategoryToServerValue, mapServerValueToCategory } from '@/utils/categoryUtils'; // 카테고리 매핑 유틸

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
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false); // 초기값 false로 변경

  const { createItinerary } = useItineraryCreator(); // 클라이언트 폴백용
  const { generateSchedule: generateScheduleViaHook, isGenerating: isServerGenerating } = useScheduleGeneratorHook();
  const { setServerRoutes, clearMapRoutes, renderItineraryRoute: renderContextItineraryRoute, addMarkers, panTo } = useMapContext(); // renderItineraryRoute 이름 변경, addMarkers, panTo 추가

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

  const parseServerResponse = useCallback((response: ServerResponseType, currentSelectedPlaces: SelectedPlace[]): ItineraryDay[] => {
    if (!response.schedule || !response.route_summary) {
      console.warn("서버 응답에 schedule 또는 route_summary 필드가 누락되었습니다.");
      return [];
    }

    const newItinerary: ItineraryDay[] = [];

    response.route_summary.forEach((summaryItem, index) => {
      const dayNumber = index + 1; // route_summary의 순서를 일차로 간주

      // 해당 일자의 장소들 필터링 (주의: 서버의 'schedule'이 전체 목록일 경우 필요, 일자별로 구분되어 있다면 그대로 사용)
      // 여기서는 서버의 'schedule'이 모든 날의 장소를 포함하��, 각 장소에 day 정보가 없다고 가정.
      // 만약 서버 'schedule'이 이미 일자별로 구분되어 있다면, 이 로직은 크게 단순화됨.
      // 현재 명세로는 'schedule'이 전체 목록인지, 'route_summary'의 'day' 필드와 어떻게 연결되는지 불분명.
      // 우선은 'schedule'의 모든 장소를 해당 'dayNumber'에 할당한다고 가정하고,
      // 실제 서버 응답에 따라 'day'별로 필터링하는 로직 추가 필요.
      // 지금은 모든 ServerScheduleItem을 첫날에 할당하는 방식으로 단순화. 이는 수정 필요!
      // -> 수정: schedule이 날짜 구분없이 순서대로 온다고 가정하고, route_summary와 순서대로 매칭.
      //    더 정확히는, 서버가 schedule 항목에 day 정보를 주거나, route_summary의 장소 목록을 사용해야 함.
      //    여기서는 임시로, 모든 schedule 항목을 가져와 매핑 시도.
      //    실제로는 서버 응답의 `schedule`이 `place_type`과 `place_name`만으로 구성되어 있으므로,
      //    `currentSelectedPlaces` 또는 `allPlaces` 목록에서 매칭해야 함.

      const dayPlaces: ItineraryPlaceWithTime[] = response.schedule
        // .filter(p => p.day === dayNumber) // 만약 ServerScheduleItem에 day 정보가 있다면 필터링
        .map((serverPlace: ServerScheduleItem) => {
          // 서버에서 받은 place_id 또는 place_name으로 currentSelectedPlaces에서 원본 장소 정보 찾기
          let basePlace = serverPlace.place_id 
            ? currentSelectedPlaces.find(p => p.id.toString() === serverPlace.place_id?.toString())
            : currentSelectedPlaces.find(p => p.name === serverPlace.place_name);

          if (!basePlace) {
             // 후보 장소에서도 찾아보기 (이름 기반)
            basePlace = selectedPlaces.find(p => p.name === serverPlace.place_name && p.isCandidate);
          }
          
          if (basePlace) {
            return {
              ...basePlace, // x, y, address 등 모든 정보 포함
              name: serverPlace.place_name, // 서버에서 받은 이름으로 덮어쓸 수 있음
              category: mapServerValueToCategory(serverPlace.place_type) as CategoryName, // 서버 place_type을 내부 CategoryName으로 변환
              timeBlock: serverPlace.time_block, // 서버에서 받은 time_block 사용
              // 서버 응답에 arriveTime, departTime, stayDuration이 있다면 여기에 추가
              arriveTime: serverPlace.arriveTime,
              departTime: serverPlace.departTime,
              stayDuration: serverPlace.stayDuration,
            } as ItineraryPlaceWithTime;
          }
          // 매칭되는 장소가 없으면 기본값으로 생성 (좌표 등이 없어 지도에 표시 어려움)
          return {
            id: serverPlace.place_id?.toString() || `unknown_${serverPlace.place_name}_${Math.random()}`,
            name: serverPlace.place_name,
            category: mapServerValueToCategory(serverPlace.place_type) as CategoryName,
            timeBlock: serverPlace.time_block,
            address: '주소 정보 없음',
            x: 0, y: 0, // 좌표 없음
            phone: '', description: '', rating: 0, image_url: '', road_address: '', homepage: '',
            isSelected: false, isCandidate: false,
            arriveTime: serverPlace.arriveTime,
            departTime: serverPlace.departTime,
            stayDuration: serverPlace.stayDuration,
          } as ItineraryPlaceWithTime;
        });

      newItinerary.push({
        day: dayNumber,
        places: dayPlaces, // 이 부분은 수정 필요: dayPlaces가 route_summary에 명시된 장소들로 구성되어야 함.
                           // interleaved_route의 장소 노드 ID를 기반으로 dayPlaces를 재구성해야 함.
                           // 임시로 위에서 만든 dayPlaces를 사용.
        totalDistance: parseFloat((summaryItem.total_distance_m / 1000).toFixed(2)), // m -> km
        interleaved_route: summaryItem.interleaved_route,
        originalDayString: summaryItem.day, // "Tue" 등 원본 문자열 저장
      });
    });
    
    // 임시 수정: interleaved_route의 장소 노드 ID를 기반으로 ItineraryDay.places를 재구성
    const finalItinerary = newItinerary.map(dayItinerary => {
        if (!dayItinerary.interleaved_route) return dayItinerary;

        const placeNodeIds = extractAllNodesFromRoute(dayItinerary.interleaved_route)
            .filter((item, index, arr) => arr.indexOf(item) === index && (index % 2 === 0)); // 장소 노드 ID, 중복 제거

        const placesForThisDay: ItineraryPlaceWithTime[] = placeNodeIds.map(nodeId => {
            // currentSelectedPlaces 에서 geoNodeId 또는 id로 장소 찾기
            let foundPlace = currentSelectedPlaces.find(p => p.geoNodeId === nodeId.toString() || p.id.toString() === nodeId.toString());
            
            // 서버의 schedule 리스트에서도 이름으로 매칭 시도 (geoNodeId가 없을 경우 대비)
            // 이때는 서버 스케줄의 time_block 정보를 활용해야 함.
            const serverScheduleItem = response.schedule.find(sp => 
                (sp.place_id && sp.place_id.toString() === nodeId.toString()) ||
                (foundPlace && sp.place_name === foundPlace.name) // geoNodeId로 찾은 장소의 이름과 서버 스케줄 이름 비교
            );

            if (foundPlace) {
                return {
                    ...foundPlace,
                    timeBlock: serverScheduleItem?.time_block || "시간 정보 없음", // 서버 스케줄에서 time_block 가져오기
                    category: mapServerValueToCategory(serverScheduleItem?.place_type || foundPlace.category) as CategoryName,
                    name: serverScheduleItem?.place_name || foundPlace.name,
                };
            }
            // 못찾으면 기본값 (이름은 Node ID로)
            return {
                id: nodeId.toString(), name: `장소 (ID: ${nodeId})`, category: 'unknown',
                x: 0, y: 0, address: '', phone: '', description: '', rating: 0,
                image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false,
                timeBlock: serverScheduleItem?.time_block || "시간 정보 없음",
            } as ItineraryPlaceWithTime;
        }).filter(p => p.name !== `장소 (ID: ${p.id})` || currentSelectedPlaces.some(csp => csp.id.toString() === p.id)); // 완전히 못찾은건 제외하거나, ID로만 된건 일단 포함

        return { ...dayItinerary, places: placesForThisDay };
    });

    return finalItinerary;
  }, [currentSelectedPlaces, selectedPlaces]); // currentSelectedPlaces가 props로 전달되므로 의존성 배열에 추가

  const runScheduleGenerationProcess = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const payload = preparePayload();
      if (!payload) {
        toast.error("날짜 및 시간 또는 장소 정보가 부족하여 페이로드를 준비할 수 없습니다.");
        setIsLoadingState(false);
        return;
      }

      const serverResponse = await generateScheduleViaHook(payload);
      console.log("🔍 서버 응답 (useScheduleManagement):", serverResponse);

      if (serverResponse && serverResponse.schedule && serverResponse.schedule.length > 0 && serverResponse.route_summary && serverResponse.route_summary.length > 0) {
        const parsedItinerary = parseServerResponse(serverResponse, selectedPlaces);
        setItinerary(parsedItinerary);
        
        // MapContext에 서버 경로 데이터 전달 (interleaved_route 포함)
        const routesForMapContext: Record<number, Pick<ServerRouteSummaryItem, 'interleaved_route'>> = {};
        serverResponse.route_summary.forEach((summary, index) => {
          // API가 day: "1" 형태의 문자열을 주면 parseInt(summary.day, 10) 사용
          // 현재는 순서 기반으로 dayNumber 생성
          const dayNumber = index + 1; 
          routesForMapContext[dayNumber] = { interleaved_route: summary.interleaved_route };
        });
        setServerRoutes(routesForMapContext as any); // setServerRoutes 타입이 Record<number, ServerRouteResponse> 이므로 맞춤
                                                 // ServerRouteResponse는 interleaved_route를 포함하므로 캐스팅이 어느정도 맞음.
        
        if (parsedItinerary.length > 0) {
          setSelectedDay(parsedItinerary[0].day);
          toast.success("서버로부터 일정을 성공적으로 생성했습니다!");
        } else {
          toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (파싱 후 빈 일정)");
          setItinerary([]); // 빈 일정으로 설정
        }
      } else {
        toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (서버 응답 부족)");
        setItinerary([]); // 빈 일정으로 설정
        // 클라이언트 폴백 로직 (선택적, 현재는 서버 실패 시 빈 일정만 표시)
        if (dates) {
            console.warn("서버 응답이 없거나 형식이 맞지 않아 클라이언트 측 기본 일정을 생성합니다.");
            const clientFallbackItinerary: CreatorItineraryDay[] = createItinerary(
              selectedPlaces.filter(p => !p.isCandidate), // 후보 제외한 장소로만 생성
              dates.startDate,
              dates.endDate,
              dates.startTime,
              dates.endTime
            );
            const domainFallbackItinerary = clientFallbackItinerary.map(day => ({
                ...day,
                places: day.places.map(p => ({...p, timeBlock: "시간 정보 없음"} as ItineraryPlaceWithTime)),
            }));
            setItinerary(domainFallbackItinerary);
            if (domainFallbackItinerary.length > 0) setSelectedDay(domainFallbackItinerary[0].day);
            toast.info("클라이언트에서 기본 일정이 생성되었습니다. (서버 데이터 없음)");
        }
      }
    } catch (error) {
      console.error("일정 생성 전체 프로세스 오류 (useScheduleManagement):", error);
      toast.error("⚠️ 선택한 장소 정보 또는 경로 계산이 부족하여 일정을 생성하지 못했습니다. (오류 발생)");
      setItinerary([]); // 오류 시 빈 일정
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
    createItinerary
  ]);

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
    console.log(`[useScheduleManagement] ${day}일차 선택됨. 지도 업데이트 트리거.`);
    // 지도 업데이트는 selectedDay, itinerary 변경에 따른 useEffect에서 처리
  }, []);

  useEffect(() => {
    console.log("[useScheduleManagement] isLoadingState:", isLoadingState, "isServerGenerating:", isServerGenerating);
  }, [isLoadingState, isServerGenerating]);

  // selectedDay 또는 itinerary 변경 시 지도 경로 및 마커 업데이트
  useEffect(() => {
    if (selectedDay === null || itinerary.length === 0) {
      clearMapRoutes(); // 선택된 날이 없거나 일정이 없으면 경로 지우기
      // addMarkers([]); // 마커도 지우려면 추가
      return;
    }

    const currentDayData = itinerary.find(d => d.day === selectedDay);
    if (currentDayData) {
      console.log(`[useScheduleManagement] 지도에 ${selectedDay}일차 표시 준비. 장소 ${currentDayData.places.length}개.`);
      // renderContextItineraryRoute는 useMapCore의 renderItineraryRoute를 호출.
      // 해당 함수는 itineraryDay.interleaved_route를 사용하여 GeoJSON 경로를 그림.
      renderContextItineraryRoute(currentDayData); // 여기가 경로를 그리는 부분

      // 마커 추가 로직: currentDayData.places 사용
      // 이 마커들은 이미 parseServerResponse에서 좌표 등 정보가 채워져 있어야 함.
      if (currentDayData.places.length > 0) {
        // addMarkers 호출 전 기존 마커 정리 (renderContextItineraryRoute에서 clearAllRoutes는 하지만, 마커는 별도 관리 가능)
        // addMarkers 함수는 내부적으로 clearMarkersAndUiElements를 호출할 수도 있음 (MapContext 구현에 따라 다름)
        // 여기서는 명시적으로 addMarkers를 사용.
        addMarkers(currentDayData.places, { 
            isItinerary: true, 
            useColorByCategory: true, 
            // onClick 핸들러는 MapMarkers.tsx 에서 정의된 것을 재활용하거나 여기서 새로 정의
        });
        // 첫번째 장소로 지도 이동
        const firstPlace = currentDayData.places[0];
        if (firstPlace && typeof firstPlace.y === 'number' && typeof firstPlace.x === 'number') {
            panTo({ lat: firstPlace.y, lng: firstPlace.x });
        }
      } else {
        // addMarkers([]); // 장소가 없으면 마커 지우기
      }
    } else {
      console.warn(`[useScheduleManagement] 선택된 ${selectedDay}일차 데이터를 찾을 수 없습니다.`);
      clearMapRoutes();
      // addMarkers([]);
    }
  }, [selectedDay, itinerary, clearMapRoutes, renderContextItineraryRoute, addMarkers, panTo]);

  return {
    itinerary,
    selectedDay,
    isLoading: isLoadingState || isServerGenerating,
    handleSelectDay,
    runScheduleGenerationProcess,
  };
};
