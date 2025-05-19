import { useState, useEffect, useCallback } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime, RouteData, SelectedPlace } from '@/types';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';

// Helper to get day of week string (e.g., "Mon")
const getDayOfWeekString = (date: Date): string => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
};

// Helper to get date string (e.g., "05/21")
const getDateStringMMDD = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
};

// 서버 응답을 ItineraryDay[] 형태로 파싱하는 함수
const parseServerResponseInternal = (
  serverResponse: any, 
  allKnownPlaces: SelectedPlace[] // selected_places와 candidate_places 통합 배열
): ItineraryDay[] => {
  try {
    console.log("[useItinerary] parseServerResponseInternal 시작:", {
      scheduleLength: serverResponse.schedule?.length,
      routeSummaryLength: serverResponse.route_summary?.length,
      allKnownPlacesCount: allKnownPlaces?.length || 0,
    });
    
    if (!serverResponse.schedule || !serverResponse.route_summary || 
        !Array.isArray(serverResponse.schedule) || !Array.isArray(serverResponse.route_summary)) {
      console.error("[useItinerary] 서버 응답 형식이 올바르지 않습니다.");
      toast.error("서버 응답 형식이 올바르지 않습니다.");
      return [];
    }
    
    const placeNameToKnownPlaceMap: Map<string, SelectedPlace> = new Map();
    allKnownPlaces.forEach(p => {
      if (p.name) {
        placeNameToKnownPlaceMap.set(p.name, p);
      }
    });

    const placeIdToCoordsMap: Record<string, { x: number; y: number; nodeId?: string }> = {};

    // 서버 응답의 schedule에서 장소 정보 및 좌표/Node ID 추출
    serverResponse.schedule.forEach((item: any) => {
      const placeName = item.place_name || '';
      const knownPlace = placeNameToKnownPlaceMap.get(placeName);
      const internalPlaceId = knownPlace?.id?.toString(); // 애플리케이션 내부 ID (1000번대, 5000번대 등)
      const serverNodeId = item.id?.toString(); // 서버에서 내려준 ID (NODE_ID)

      if (!internalPlaceId) {
        console.warn(`[useItinerary] 장소 '${placeName}'에 대한 내부 ID를 selected/candidate places에서 찾지 못했습니다. 서버 Node ID: ${serverNodeId}`);
        // 내부 ID를 못찾으면 일단 서버 Node ID를 geoNodeId로 사용하고, 좌표는 기본값
        placeIdToCoordsMap[serverNodeId || placeName] = { // 키를 서버 Node ID 또는 이름으로
          x: knownPlace?.x ?? 126.5311884, // 아는 장소에 x,y가 있다면 사용
          y: knownPlace?.y ?? 33.4996213,
          nodeId: serverNodeId 
        };
        return;
      }
      
      // 좌표 우선순위:
      // 1. 서버 응답의 item.x, item.y
      // 2. allKnownPlaces (selected/candidate) 에 있는 x, y
      // 3. 기본값
      let x = 126.5311884;
      let y = 33.4996213;

      if (item.x !== undefined && item.y !== undefined && !isNaN(parseFloat(item.x)) && !isNaN(parseFloat(item.y))) {
        x = parseFloat(item.x);
        y = parseFloat(item.y);
      } else if (knownPlace?.x !== undefined && knownPlace?.y !== undefined && !isNaN(parseFloat(knownPlace.x as any)) && !isNaN(parseFloat(knownPlace.y as any))) {
        x = parseFloat(knownPlace.x as any);
        y = parseFloat(knownPlace.y as any);
        console.log(`[useItinerary] 장소 '${placeName}' (ID: ${internalPlaceId}) 좌표: selected/candidate places 에서 가져옴 (${x}, ${y})`);
      } else {
        console.warn(`[useItinerary] 장소 '${placeName}' (ID: ${internalPlaceId}) 좌표: 서버 응답 및 selected/candidate에도 없어 기본값 사용.`);
      }
      
      placeIdToCoordsMap[internalPlaceId] = { x, y, nodeId: serverNodeId || internalPlaceId };
    });
    
    const dayGroups: Record<string, any[]> = {};
    serverResponse.schedule.forEach((item: any) => {
      const dayMatch = item.time_block?.match(/^([A-Za-z]+)_/);
      if (dayMatch && dayMatch[1]) {
        const dayKey = dayMatch[1];
        if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
        
        const placeName = item.place_name || '';
        const knownPlace = placeNameToKnownPlaceMap.get(placeName);
        const internalPlaceId = knownPlace?.id?.toString();
        const serverNodeId = item.id?.toString();

        dayGroups[dayKey].push({
          ...item,
          internal_place_id: internalPlaceId, // 내부 ID 추가
          server_node_id: serverNodeId, // 서버에서 온 NODE_ID 명확히 저장
        });
      } else {
        console.warn(`[useItinerary] 항목에서 요일을 추출할 수 없음:`, item);
      }
    });
    
    const result: ItineraryDay[] = [];
    let dayIndex = 1;
    
    for (const routeInfo of serverResponse.route_summary) {
      const dayKey = routeInfo.day; // 'Mon', 'Tue' 등
      const dayScheduleItems = dayGroups[dayKey] || [];
      
      const places: ItineraryPlaceWithTime[] = dayScheduleItems.map((item: any) => {
        const timeMatch = item.time_block?.match(/_([^_]+)$/);
        const timeBlock = timeMatch ? timeMatch[1] : 'N/A';
        const internalPlaceId = item.internal_place_id;
        const serverNodeId = item.server_node_id;
        
        const coords = placeIdToCoordsMap[internalPlaceId || serverNodeId || item.place_name] || {
          x: 126.5311884,
          y: 33.4996213,
          nodeId: serverNodeId,
        };
        
        return {
          id: internalPlaceId || serverNodeId || item.place_name, // 우선순위: 내부ID > 서버NodeID > 이름
          name: item.place_name || '이름 없는 장소',
          category: item.place_type || '기타',
          timeBlock: timeBlock,
          address: item.address || '', // 서버 응답에 address가 있다면 사용
          x: coords.x,
          y: coords.y,
          arriveTime: timeBlock,
          departTime: '',
          stayDuration: item.stay_time_minutes || 60,
          travelTimeToNext: item.travel_time_to_next_min ? `${item.travel_time_to_next_min}분` : '',
          phone: item.phone || '',
          description: item.description || '',
          image_url: item.image_url || '',
          rating: parseFloat(item.rating || '0'),
          road_address: item.road_address || '',
          homepage: item.homepage || '',
          isSelected: false, // 이 정보는 selected/candidate에서 와야 함
          isCandidate: false,
          geoNodeId: coords.nodeId || serverNodeId || internalPlaceId, // 지도 표시에 사용될 NODE_ID
        } as ItineraryPlaceWithTime;
      });
      
      const currentDate = new Date(); // TODO: 실제 여행 시작일(tripDetails.dates.startDate) 사용
      currentDate.setDate(currentDate.getDate() + dayIndex - 1);
      
      const interleavedRaw: (string | number)[] = routeInfo.interleaved_route || [];
      const interleaved = interleavedRaw.map(id => String(id));
      
      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      interleaved.forEach((id, idx) => {
        if (idx % 2 === 0) nodeIds.push(id); // NODE_ID from server
        else linkIds.push(id); // LINK_ID from server
      });

      result.push({
        day: dayIndex,
        dayOfWeek: dayKey.substring(0,3),
        date: getDateStringMMDD(currentDate),
        places: places,
        totalDistance: parseFloat(routeInfo.total_distance_m || '0') / 1000,
        routeData: { nodeIds, linkIds, segmentRoutes: [] },
        interleaved_route: interleaved,
      });
      dayIndex++;
    }
    
    console.log("[useItinerary] parseServerResponseInternal 완료:", {
      생성된일정수: result.length,
      첫날장소수: result[0]?.places?.length || 0,
      첫날장소목록_좌표포함: result[0]?.places?.map(p => ({ name: p.name, x: p.x, y: p.y, id: p.id, geoNodeId: p.geoNodeId })) || [],
      첫날경로노드수: result[0]?.routeData?.nodeIds?.length || 0,
      첫날경로링크수: result[0]?.routeData?.linkIds?.length || 0,
    });
    return result;
  } catch (error) {
    console.error("[useItinerary] parseServerResponseInternal 오류:", error);
    toast.error("서버 응답 처리 중 오류 발생");
    return [];
  }
};

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  // selectedItineraryDay를 ItineraryDay | null 타입으로 변경
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<ItineraryDay | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  // allKnownPlaces (selected + candidate) 상태 추가 또는 외부에서 주입받도록 수정
  // 예시: zustand 스토어에서 가져오거나, 부모 컴포넌트에서 prop으로 받음
  const [allKnownPlacesForParsing, setAllKnownPlacesForParsing] = useState<SelectedPlace[]>([]);

  // handleSelectItineraryDay를 ItineraryDay 객체로 받도록 수정
  const handleSelectItineraryDay = useCallback((dayData: ItineraryDay | null) => {
    setSelectedItineraryDay(dayData);
    if (dayData) {
      console.log(`[useItinerary] Selected Day ${dayData.day} places:`, dayData.places.map(p => ({name: p.name, x: p.x, y: p.y, id: p.id, geoNodeId: p.geoNodeId })));
    }
  }, []);

  // generateItinerary 함수가 @/types의 ItineraryDay[]를 반환하도록 보장
  const generateItinerary = (
    placesToUse: Place[], 
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => { 
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return [];
      }

      const creatorItineraryResult: CreatorItineraryDay[] = createItinerary(
        placesToUse,
        startDate,
        endDate,
        startTime,
        endTime
      );

      if (!creatorItineraryResult || creatorItineraryResult.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return [];
      }

      const mappedItinerary: ItineraryDay[] = creatorItineraryResult.map((creatorDay, index) => {
        const currentDayDate = new Date(startDate);
        currentDayDate.setDate(startDate.getDate() + index);
        const mappedPlaces: ItineraryPlaceWithTime[] = creatorDay.places.map(p_creator => {
            const placeWithCoords = {
                ...p_creator,
                x: p_creator.x ?? 0, 
                y: p_creator.y ?? 0, 
            };
            return placeWithCoords as ItineraryPlaceWithTime; 
        });

        const coreItineraryDay: ItineraryDay = {
          day: creatorDay.day,
          places: mappedPlaces,
          totalDistance: creatorDay.totalDistance,
          dayOfWeek: getDayOfWeekString(currentDayDate),
          date: getDateStringMMDD(currentDayDate),
          routeData: { nodeIds: [], linkIds: [], segmentRoutes: [] }, 
          interleaved_route: [], 
        };
        return coreItineraryDay;
      });

      setItinerary(mappedItinerary); 
      setIsItineraryCreated(true);
      setSelectedItineraryDay(1);
      setShowItinerary(true);

      console.log("일정 생성 완료 (useItinerary - generateItinerary):", {
        일수: mappedItinerary.length,
        총장소수: mappedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: mappedItinerary[0]?.places.map(p => ({name: p.name, x: p.x, y: p.y}))
      });

      return mappedItinerary; 
    } catch (error) {
      console.error("일정 생성 오류 (useItinerary - generateItinerary):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return [];
    }
  };

  // handleServerItineraryResponse 함수는 서버에서 이미 @/types/core 기준 ItineraryDay[]를 받는다고 가정.
  // (useScheduleParser.ts에서 그렇게 파싱한다고 되어 있음)
  const handleServerItineraryResponse = useCallback((
    serverResponse: any, // 서버 응답 원본 타입 (ServerScheduleResponse와 유사)
    knownPlaces: SelectedPlace[] // selected_places + candidate_places
  ) => {
    console.log("서버 일정 응답 처리 시작 (useItinerary):", {
      responseKeys: Object.keys(serverResponse || {}),
      knownPlacesCount: knownPlaces?.length || 0,
    });
    setAllKnownPlacesForParsing(knownPlaces); // 파싱 시 사용할 수 있도록 저장

    if (!serverResponse || !serverResponse.schedule || !serverResponse.route_summary) {
      console.warn("[useItinerary] handleServerItineraryResponse: 서버 응답이 유효하지 않습니다.");
      setItinerary([]);
      setShowItinerary(true);
      setIsItineraryCreated(false);
      setSelectedItineraryDay(null);
      toast.info("생성된 일정이 없거나 서버 응답이 올바르지 않습니다.");
      return [];
    }

    try {
      // parseServerResponseInternal 호출 시 allKnownPlaces 전달
      const parsedItinerary = parseServerResponseInternal(serverResponse, knownPlaces);

      if (!parsedItinerary || parsedItinerary.length === 0) {
        console.warn("[useItinerary] handleServerItineraryResponse: 파싱된 일정이 비어있습니다.");
        setItinerary([]);
        setShowItinerary(true);
        setIsItineraryCreated(false);
        setSelectedItineraryDay(null);
        toast.info("생성된 일정이 없습니다. 다른 조건으로 시도해보세요.");
        return [];
      }
      
      setItinerary(parsedItinerary);
      setIsItineraryCreated(true);
      setShowItinerary(true);
      
      if (parsedItinerary.length > 0 && parsedItinerary[0]) {
        setSelectedItineraryDay(parsedItinerary[0]); // 첫 번째 ItineraryDay 객체로 선택
        console.log(`[useItinerary] handleServerItineraryResponse: 첫 번째 일자(${parsedItinerary[0].day}) 선택`);
      } else {
        setSelectedItineraryDay(null);
      }

      // 이벤트 발생 로직은 유지 (필요에 따라 수정)
      // ... keep existing code (setTimeout for events)
      setTimeout(() => {
        console.log("[useItinerary] handleServerItineraryResponse: forceRerender 이벤트 발생");
        window.dispatchEvent(new Event('forceRerender'));
        
        const event = new CustomEvent('itineraryWithCoordinatesReady', {
          detail: { itinerary: parsedItinerary }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryWithCoordinatesReady 이벤트 발생");
        window.dispatchEvent(event);

        const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
          detail: { 
            itinerary: parsedItinerary,
            selectedDay: parsedItinerary[0] || null // selectedDay도 객체로 전달
          }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생 (from handleServerItineraryResponse)");
        window.dispatchEvent(itineraryCreatedEvent);
      }, 100);

      return parsedItinerary;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      setItinerary([]);
      setIsItineraryCreated(false);
      setShowItinerary(false);
      setSelectedItineraryDay(null);
      toast.error("일정 처리 중 오류가 발생했습니다.");
      return []; 
    }
  }, []); // useCallback 의존성 배열에 필요한 항목 추가 (예: setAllKnownPlacesForParsing)
  
  // createDebugItinerary 함수가 @/types의 ItineraryDay[]를 반환하도록 보장
  const createDebugItinerary = (startDateInput: Date | null): ItineraryDay[] => { 
    const result: ItineraryDay[] = []; 
    const startDate = startDateInput || new Date(); 
    
    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const places: ItineraryPlaceWithTime[] = []; 
      for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
        const placeIdNum = 4060000000 + i * 10000 + j * 100;
        const placeIdStr = String(placeIdNum);
        const debugCategory = ['attraction', 'restaurant', 'cafe', 'accommodation'][j % 4];
        places.push({
          id: placeIdStr, 
          name: `디버깅 장소 ${i+1}-${j+1}`,
          address: '제주특별자치도',
          phone: 'N/A',
          category: debugCategory, 
          description: '디버그용 장소 설명',
          rating: 4.0 + Math.random(),
          x: 126.5 + (Math.random() * 0.5 - 0.25), 
          y: 33.4 + (Math.random() * 0.2 - 0.1),   
          image_url: '',
          road_address: '제주특별자치도 도로명',
          homepage: '',
          timeBlock: `${(9 + j * 2).toString().padStart(2, '0')}:00`, 
          geoNodeId: placeIdStr, 
          arriveTime: `${(9 + j * 2).toString().padStart(2, '0')}:00`,
          departTime: `${(9 + j * 2 + 1).toString().padStart(2, '0')}:00`,
          stayDuration: 60,
          travelTimeToNext: "15분",
        } as ItineraryPlaceWithTime); 
      }
      
      const nodeIdsNum = places.map(p => Number(p.id));
      const linkIdsNum: number[] = [];
      for (let j = 0; j < nodeIdsNum.length - 1; j++) {
        linkIdsNum.push(5060000000 + i * 10000 + j * 100);
      }
      
      const interleavedRouteNum: (string | number)[] = [];
      for (let j = 0; j < nodeIdsNum.length; j++) {
        interleavedRouteNum.push(String(nodeIdsNum[j]));
        if (j < linkIdsNum.length) {
          interleavedRouteNum.push(String(linkIdsNum[j]));
        }
      }

      result.push({
        day: i + 1,
        places: places,
        totalDistance: parseFloat((10 + Math.random() * 20).toFixed(2)),
        routeData: { 
          nodeIds: nodeIdsNum.map(String),
          linkIds: linkIdsNum.map(String),
          segmentRoutes: [] 
        },
        interleaved_route: interleavedRouteNum, 
        dayOfWeek: getDayOfWeekString(currentDate), 
        date: getDateStringMMDD(currentDate), 
      });
    }
    return result;
  };

  // rawServerResponseReceived 이벤트 리스너 추가
  useEffect(() => {
    const handleRawServerResponse = (event: Event) => {
      console.log("[useItinerary] rawServerResponseReceived 이벤트 수신", (event as CustomEvent).detail);
      const detail = (event as CustomEvent).detail;
      const serverResponseData = detail?.response;
      const knownPlacesData = detail?.knownPlaces as SelectedPlace[] || []; // selected/candidate places
      
      // handleServerItineraryResponse 호출 시 knownPlacesData 전달
      handleServerItineraryResponse(serverResponseData, knownPlacesData);
    };
    
    window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
    
    return () => {
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
    };
  }, [handleServerItineraryResponse]); // handleServerItineraryResponse를 의존성 배열에 추가

  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: ItineraryDay | null }>; // selectedDay 타입 변경
      console.log("[useItinerary] 'itineraryCreated' 이벤트 최종 수신:", customEvent.detail);
      
      const receivedItinerary = customEvent.detail.itinerary;
      const receivedSelectedDay = customEvent.detail.selectedDay; // ItineraryDay 객체

      if (receivedItinerary && Array.isArray(receivedItinerary)) {
        if (receivedItinerary.length === 0) {
          // ... keep existing code (empty itinerary handling)
          setItinerary([]);
          setShowItinerary(true); 
          setIsItineraryCreated(false); 
          setSelectedItineraryDay(null);
          return;
        }
        
        const validItinerary = receivedItinerary.filter(day => 
          day && 
          typeof day.day === 'number' && 
          Array.isArray(day.places) &&
          // 장소 좌표 유효성 검사는 parseServerResponse에서 이미 처리됨
          typeof day.dayOfWeek === 'string' && 
          typeof day.date === 'string' &&       
          day.routeData && typeof day.routeData === 'object' && 
          Array.isArray(day.interleaved_route) 
        );
        
        // ... keep existing code (validItinerary logging and handling)
        if (validItinerary.length !== receivedItinerary.length) {
          console.warn("[useItinerary] 유효하지 않거나 좌표가 없는 일정 데이터가 포함되어 필터링되었습니다:", {
            originalCount: receivedItinerary.length,
            validCount: validItinerary.length,
            invalidItems: receivedItinerary.filter(day => !validItinerary.includes(day))
                .map(day => ({ day: day.day, places: day.places.map(p => ({name: p.name, x:p.x, y:p.y}))})),
          });
        }
        
        if (validItinerary.length === 0) {
          console.warn("[useItinerary] 유효한 일정 데이터가 없습니다 (itineraryCreated listener). 원본:", receivedItinerary);
          setItinerary([]);
          setShowItinerary(true);
          setIsItineraryCreated(false);
          setSelectedItineraryDay(null);
          return;
        }
        
        console.log("[useItinerary] itineraryCreated 리스너에서 유효한 일정 데이터로 상태 업데이트:", validItinerary);
        setItinerary(validItinerary);
        setIsItineraryCreated(true);
        setShowItinerary(true);
        
        // selectedDay도 객체로 설정
        let dayObjectToSelect = receivedSelectedDay;
        if (!dayObjectToSelect || !validItinerary.find(d => d.day === dayObjectToSelect.day)) {
            dayObjectToSelect = validItinerary.length > 0 ? validItinerary[0] : null;
        }
        setSelectedItineraryDay(dayObjectToSelect);
        console.log("[useItinerary] itineraryCreated 리스너에서 selectedDay 설정:", dayObjectToSelect);
      } else {
        console.error("[useItinerary] 'itineraryCreated' 이벤트에서 유효한 일정 데이터를 받지 못했습니다.");
        setItinerary([]);
        setIsItineraryCreated(false);
        setShowItinerary(true);
        setSelectedItineraryDay(null);
      }
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, []); // 의존성 배열은 비워두거나, 필요한 안정적인 함수를 추가

  return {
    itinerary,
    setItinerary, // 직접 설정보다는 이벤트 기반으로 업데이트하는 것을 권장
    selectedItineraryDay,
    setSelectedItineraryDay: handleSelectItineraryDay, // 핸들러 사용
    showItinerary,
    setShowItinerary,
    isItineraryCreated,
    generateItinerary, // 클라이언트 사이드 생성 (필요시)
    // handleServerItineraryResponse, // 이제 이벤트 기반으로 처리
    createDebugItinerary,
    // allKnownPlacesForParsing, // 이 상태를 외부로 노출할 필요는 없을 수 있음
    // setAllKnownPlacesForParsing,
  };
};
