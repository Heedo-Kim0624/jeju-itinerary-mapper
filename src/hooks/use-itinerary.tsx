import { useState, useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime, RouteData } from '@/types';
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
const parseServerResponse = (serverResponse: any): ItineraryDay[] => {
  try {
    console.log("[useItinerary] parseServerResponse 시작:", {
      schedule: serverResponse.schedule?.length,
      route_summary: serverResponse.route_summary?.length,
      schedule_first: serverResponse.schedule?.[0] || {},
      route_first: serverResponse.route_summary?.[0] || {}
    });
    
    if (!serverResponse.schedule || !serverResponse.route_summary || 
        !Array.isArray(serverResponse.schedule) || !Array.isArray(serverResponse.route_summary)) {
      console.error("[useItinerary] 서버 응답 형식이 올바르지 않습니다.");
      toast.error("서버 응답 형식이 올바르지 않습니다.");
      return [];
    }
    
    const placeCoordinates: Record<string, {x: number, y: number}> = {};
    
    serverResponse.schedule.forEach((item: any) => {
      const idKey = item.id || item.place_id; 
      if (idKey && (item.x !== undefined || item.longitude !== undefined) && 
          (item.y !== undefined || item.latitude !== undefined)) {
        placeCoordinates[String(idKey)] = { 
          x: parseFloat(item.x || item.longitude || '0'), 
          y: parseFloat(item.y || item.latitude || '0') 
        };
      } else if (idKey) {
        console.warn(`[useItinerary] 장소 '${item.place_name}' (ID: ${idKey})에 대한 좌표 정보가 서버 응답에 없습니다.`);
      }
    });
    
    const dayGroups: Record<string, any[]> = {};
    serverResponse.schedule.forEach((item: any) => {
      console.log("[useItinerary] 일정 항목 처리:", {
        time_block: item.time_block,
        place_name: item.place_name,
        place_type: item.place_type,
        id: item.id, x: item.x, y: item.y
      });
      
      const dayMatch = item.time_block?.match(/^([A-Za-z]+)_/); 
      if (dayMatch && dayMatch[1]) {
        const day = dayMatch[1];
        if (!dayGroups[day]) {
          dayGroups[day] = [];
        }
        dayGroups[day].push(item);
      } else {
        console.warn(`[useItinerary] 항목에서 요일을 추출할 수 없음:`, item);
      }
    });
    
    console.log("[useItinerary] 날짜별 그룹화 결과:", Object.keys(dayGroups).map(day => ({ day, count: dayGroups[day].length })));
    
    const result: ItineraryDay[] = [];
    let dayIndex = 1; 
    
    for (const routeInfo of serverResponse.route_summary) {
      const dayKey = routeInfo.day; 
      const dayPlacesRaw = dayGroups[dayKey] || [];
      
      console.log(`[useItinerary] ${dayKey}일 경로 정보 처리:`, routeInfo);
      console.log(`[useItinerary] ${dayKey}일 매칭된 장소 (raw):`, dayPlacesRaw.map((p:any) => ({name: p.place_name, id: p.id})));
      
      const places: ItineraryPlaceWithTime[] = dayPlacesRaw.map((placeRaw: any) => {
        const timeMatch = placeRaw.time_block?.match(/_([^_]+)$/);
        const timeBlock = timeMatch ? timeMatch[1] : 'N/A';
        
        const placeIdFromServer = String(placeRaw.id || placeRaw.place_id || Math.random().toString(36).substring(7));

        let coordsInput = placeCoordinates[placeIdFromServer];
        let defaultCoordsUsed = false;
        if (!coordsInput) {
            coordsInput = {
                x: 126.5311884, 
                y: 33.4996213,
            };
            defaultCoordsUsed = true;
        }
        
        const coords = { ...coordsInput };

        if (defaultCoordsUsed) { // Check the flag instead of property on coords
            console.warn(`[useItinerary] 장소 ID '${placeIdFromServer}' (${placeRaw.place_name})에 대한 좌표를 찾지 못해 기본값을 사용합니다.`);
        }
        
        return {
          id: placeIdFromServer,
          name: placeRaw.place_name || '이름 없는 장소',
          category: placeRaw.place_type || '기타',
          timeBlock: timeBlock,
          address: placeRaw.address || '',
          x: coords.x,
          y: coords.y,
          arriveTime: timeBlock, 
          departTime: '',     
          stayDuration: placeRaw.stay_time_minutes || 60, 
          travelTimeToNext: placeRaw.travel_time_to_next_min ? `${placeRaw.travel_time_to_next_min}분` : '',
          phone: placeRaw.phone || '',
          description: placeRaw.description || '',
          image_url: placeRaw.image_url || '',
          rating: parseFloat(placeRaw.rating || '0'),
          road_address: placeRaw.road_address || '',
          homepage: placeRaw.homepage || '',
          geoNodeId: placeIdFromServer, 
        } as ItineraryPlaceWithTime;
      });
      
      const currentDate = new Date(); // TODO: 실제 여행 시작일(tripDetails.dates.startDate) 사용
      currentDate.setDate(currentDate.getDate() + dayIndex -1);
      
      const nodeIds = routeInfo.places_routed?.map((id: any) => String(id)) || [];
      const linkIds = routeInfo.links_routed?.map((id: any) => String(id)) || [];
      const interleaved = routeInfo.interleaved_route?.map((id: any) => String(id)) || [];

      const itineraryDay: ItineraryDay = {
        day: dayIndex,
        dayOfWeek: dayKey.substring(0,3), 
        date: getDateStringMMDD(currentDate),
        places: places,
        totalDistance: parseFloat(routeInfo.total_distance_m || '0') / 1000, 
        routeData: {
          nodeIds: nodeIds,
          linkIds: linkIds, 
          segmentRoutes: [], 
        },
        interleaved_route: interleaved.length > 0 ? interleaved : nodeIds, 
      };
      
      result.push(itineraryDay);
      dayIndex++;
    }
    
    console.log("[useItinerary] parseServerResponse 완료:", {
      생성된일정수: result.length,
      첫날장소수: result[0]?.places?.length || 0,
      첫날장소목록_좌표포함: result[0]?.places?.map(p => ({ name: p.name, x: p.x, y: p.y, id: p.id })) || []
    });
    
    return result;
  } catch (error) {
    console.error("[useItinerary] parseServerResponse 오류:", error);
    toast.error("서버 응답 처리 중 오류 발생");
    return [];
  }
};

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
    const selectedDayData = itinerary?.find(d => d.day === day);
    if (selectedDayData) {
      console.log(`[useItinerary] Selected Day ${day} places:`, selectedDayData.places.map(p => ({name: p.name, x: p.x, y: p.y, id: p.id })));
    }
  };

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
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => { 
    console.log("서버 일정 응답 처리 시작 (useItinerary):", {
      일수: serverItinerary?.length || 0,
      첫날장소수: serverItinerary?.[0]?.places?.length || 0,
      첫날장소샘플: serverItinerary?.[0]?.places?.slice(0,2).map(p => ({ name: p.name, x: p.x, y: p.y }))
    });

    if (!serverItinerary || serverItinerary.length === 0) {
      console.warn("[useItinerary] handleServerItineraryResponse: 빈 일정이 전달되었습니다.");
      setItinerary([]); 
      setShowItinerary(true); 
      setIsItineraryCreated(false); 
      toast.info("생성된 일정이 없습니다. 다른 조건으로 시도해보세요.");
      return []; 
    }

    try {
      setItinerary(serverItinerary);
      setIsItineraryCreated(true); 
      
      console.log("[useItinerary] handleServerItineraryResponse: 일정 패널 표시 활성화");
      setShowItinerary(true);
      
      if (serverItinerary.length > 0 && serverItinerary[0].day) {
        console.log(`[useItinerary] handleServerItineraryResponse: 첫 번째 일자(${serverItinerary[0].day}) 선택`);
        setSelectedItineraryDay(serverItinerary[0].day);
      } else if (serverItinerary.length > 0) {
        setSelectedItineraryDay(1); 
      }

      setTimeout(() => {
        console.log("[useItinerary] handleServerItineraryResponse: forceRerender 이벤트 발생");
        window.dispatchEvent(new Event('forceRerender'));
        
        const event = new CustomEvent('itineraryWithCoordinatesReady', {
          detail: { itinerary: serverItinerary }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryWithCoordinatesReady 이벤트 발생");
        window.dispatchEvent(event);

        const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
          detail: { 
            itinerary: serverItinerary,
            selectedDay: selectedItineraryDay 
          }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생 (from handleServerItineraryResponse)");
        window.dispatchEvent(itineraryCreatedEvent);
      }, 100);

      return serverItinerary;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      setIsItineraryCreated(false);
      setShowItinerary(false); 
      toast.error("일정 처리 중 오류가 발생했습니다.");
      return []; 
    }
  };
  
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
      const serverResponse = (event as CustomEvent).detail?.response;
      
      if (serverResponse && serverResponse.schedule && serverResponse.route_summary) {
        const parsedItinerary = parseServerResponse(serverResponse); 
        console.log("[useItinerary] 서버 응답 파싱 완료. 파싱된 일정:", parsedItinerary);
        
        if (parsedItinerary && parsedItinerary.length > 0) {
          setItinerary(parsedItinerary);
          setIsItineraryCreated(true);
          setShowItinerary(true);
          
          const firstDay = parsedItinerary.find(day => day.day === 1) || parsedItinerary[0];
          if (firstDay && firstDay.day) {
            setSelectedItineraryDay(firstDay.day);
             console.log(`[useItinerary] 첫 번째 유효한 날짜 (${firstDay.day}) 선택됨.`);
          } else {
             console.warn("[useItinerary] 파싱된 일정에 유효한 첫 날 정보가 없습니다.");
             setSelectedItineraryDay(null); 
          }
          
          const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
            detail: { 
              itinerary: parsedItinerary,
              selectedDay: firstDay ? firstDay.day : null
            }
          });
          console.log("[useItinerary] itineraryCreated 이벤트 발생 (from rawServerResponseReceived)");
          window.dispatchEvent(itineraryCreatedEvent);
        } else {
          console.error("[useItinerary] 서버 응답 파싱 결과가 비어있거나 유효하지 않습니다.");
          setItinerary([]); 
          setIsItineraryCreated(false);
          setShowItinerary(true); 
          setSelectedItineraryDay(null);
          toast.error("일정 생성에 실패했거나 데이터가 없습니다. 다시 시도해주세요.");
           const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
            detail: { 
              itinerary: [],
              selectedDay: null
            }
          });
          window.dispatchEvent(itineraryCreatedEvent);
        }
      } else {
        console.error("[useItinerary] 서버 응답이 유효하지 않거나 필요한 데이터가 없습니다:", serverResponse);
        setItinerary([]);
        setIsItineraryCreated(false);
        setShowItinerary(true); 
        setSelectedItineraryDay(null);
        toast.error("서버 응답이 유효하지 않습니다. 다시 시도해주세요.");
         const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
            detail: { 
              itinerary: [],
              selectedDay: null
            }
          });
        window.dispatchEvent(itineraryCreatedEvent);
      }
    };
    
    window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
    
    return () => {
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]); 

  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null }>;
      console.log("[useItinerary] 'itineraryCreated' 이벤트 최종 수신:", customEvent.detail);
      
      const receivedItinerary = customEvent.detail.itinerary;

      if (receivedItinerary && Array.isArray(receivedItinerary)) {
        if (receivedItinerary.length === 0) {
          console.warn("[useItinerary] 수신된 일정 데이터가 비어 있습니다. (itineraryCreated listener)");
          setItinerary([]);
          setShowItinerary(true); 
          setIsItineraryCreated(false); 
          setSelectedItineraryDay(null);
          return;
        }
        
        const validItinerary = receivedItinerary.filter(day => 
          day && 
          typeof day.day === 'number' && 
          day.places && Array.isArray(day.places) &&
          day.places.every(p => typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y)) &&
          typeof day.dayOfWeek === 'string' && 
          typeof day.date === 'string' &&       
          day.routeData && typeof day.routeData === 'object' && 
          Array.isArray(day.interleaved_route) 
        );
        
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
        
        let dayToSelect = customEvent.detail.selectedDay;
        if (dayToSelect === null || !validItinerary.find(d => d.day === dayToSelect)) {
            dayToSelect = validItinerary.length > 0 ? validItinerary[0].day : null;
        }
        setSelectedItineraryDay(dayToSelect);
        
        console.log("[useItinerary] itineraryCreated 리스너에서 상태 업데이트 완료:", {
          일정길이: validItinerary.length,
          선택된일자: dayToSelect,
          일정패널표시: true,
          일정생성됨: true
        });
        
        setTimeout(() => {
          console.log("[useItinerary] 강제 리렌더링 이벤트 발생 (itineraryCreated 리스너 내부)");
          window.dispatchEvent(new Event('forceRerender'));
        }, 0); 
      } else {
        console.error("[useItinerary] itineraryCreated 이벤트에 유효한 일정 데이터가 없습니다:", customEvent.detail);
        setItinerary([]);
        setShowItinerary(true);
        setIsItineraryCreated(false);
        setSelectedItineraryDay(null);
      }
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]);

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    isItineraryCreated,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
    handleSelectItineraryDay,
    generateItinerary,
    handleServerItineraryResponse,
    createDebugItinerary
  };
};
