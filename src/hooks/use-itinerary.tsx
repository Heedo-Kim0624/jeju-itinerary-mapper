
import { useState, useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime, RouteData } from '@/types'; // @/types 에서 타입 가져오기 (core.ts 재수출)
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator'; // 읽기 전용 파일의 타입은 별칭으로 구분
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

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null); // 상태 타입은 @/types의 ItineraryDay 사용
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  // 서버 응답을 ItineraryDay[] 형태로 파싱하는 함수
  const parseServerResponse = (serverResponse: any): ItineraryDay[] => {
    try {
      console.log("[useItinerary] parseServerResponse 시작:", {
        schedule: serverResponse.schedule?.length,
        route_summary: serverResponse.route_summary?.length,
        schedule_first: serverResponse.schedule?.[0],
        route_first: serverResponse.route_summary?.[0]
      });
      
      if (!serverResponse.schedule || !serverResponse.route_summary || 
          !Array.isArray(serverResponse.schedule) || !Array.isArray(serverResponse.route_summary)) {
        console.error("[useItinerary] 서버 응답 형식이 올바르지 않습니다.");
        return [];
      }
      
      // 날짜별로 그룹화
      const dayGroups: Record<string, any[]> = {};
      serverResponse.schedule.forEach((item: any) => {
        console.log("[useItinerary] 일정 항목 처리:", item);
        const dayMatch = item.time_block?.match(/^([A-Za-z]+)_/);
        if (dayMatch && dayMatch[1]) {
          const day = dayMatch[1]; // 'Mon', 'Tue' 등
          if (!dayGroups[day]) {
            dayGroups[day] = [];
          }
          dayGroups[day].push(item);
        } else {
          console.warn("[useItinerary] 일정 항목에서 day를 추출할 수 없음:", item);
        }
      });
      
      console.log("[useItinerary] 날짜별 그룹화 결과:", Object.keys(dayGroups).map(day => ({
        day,
        count: dayGroups[day].length
      })));
      
      // route_summary와 매칭하여 ItineraryDay[] 생성
      const result: ItineraryDay[] = [];
      let dayIndex = 1;
      
      for (const routeInfo of serverResponse.route_summary) {
        console.log("[useItinerary] 경로 정보 처리:", routeInfo);
        const day = routeInfo.day; // 'Mon', 'Tue' 등
        const dayPlaces = dayGroups[day] || [];
        
        console.log(`[useItinerary] ${day}일 장소 데이터:`, {
          count: dayPlaces.length,
          places: dayPlaces.map((p: any) => p.place_name || p.id)
        });
        
        // 장소 정보를 ItineraryPlaceWithTime 형태로 변환
        const places: ItineraryPlaceWithTime[] = dayPlaces.map((place: any) => {
          const timeMatch = place.time_block?.match(/_([^_]+)$/);
          const timeBlock = timeMatch ? timeMatch[1] : '';
          
          const placeData = {
            id: place.id?.toString() || Math.random().toString(36).substring(7),
            name: place.place_name || '이름 없는 장소',
            category: place.place_type || 'unknown',
            timeBlock: timeBlock,
            address: place.address || '',
            x: parseFloat(place.x || '0') || 0,
            y: parseFloat(place.y || '0') || 0,
            arriveTime: timeBlock,
            departTime: '',
            stayDuration: 60,
            travelTimeToNext: place.travel_time_to_next_min ? `${place.travel_time_to_next_min}분` : '',
            phone: place.phone || '',
            description: '',
            image_url: '',
            rating: 0,
            road_address: '',
            homepage: '',
            geoNodeId: place.id?.toString() || '',
          } as ItineraryPlaceWithTime;
          
          return placeData;
        });
        
        // 현재 날짜 계산 (startDate 기준으로 dayIndex만큼 더함)
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + dayIndex - 1);
        
        // ItineraryDay 객체 생성
        const itineraryDay: ItineraryDay = {
          day: dayIndex,
          dayOfWeek: day, // 'Mon', 'Tue' 등
          date: getDateStringMMDD(currentDate),
          places: places,
          totalDistance: (routeInfo.total_distance_m / 1000) || 0,
          routeData: {
            nodeIds: routeInfo.places_routed?.map((p: any) => p.toString()) || [],
            linkIds: routeInfo.links_routed?.map((l: any) => l.toString()) || [],
            segmentRoutes: []
          },
          interleaved_route: routeInfo.interleaved_route?.map((id: any) => id.toString()) || []
        };
        
        result.push(itineraryDay);
        dayIndex++;
      }
      
      console.log("[useItinerary] parseServerResponse 완료:", {
        생성된일정수: result.length,
        첫날장소수: result[0]?.places?.length || 0,
        첫날장소목록: result[0]?.places?.map(p => p.name) || []
      });
      
      return result;
    } catch (error) {
      console.error("[useItinerary] parseServerResponse 오류:", error);
      return [];
    }
  };

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  // generateItinerary 함수가 @/types의 ItineraryDay[]를 반환하도록 보장
  const generateItinerary = (
    placesToUse: Place[], // Place 타입은 @/types에서 온 것
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => { // 반환 타입 명시: @/types의 ItineraryDay[]
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return [];
      }

      // use-itinerary-creator.ts (읽기 전용)의 결과물 타입은 CreatorItineraryDay[]
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

      // CreatorItineraryDay[]를 @/types의 ItineraryDay[]로 정확히 매핑
      const mappedItinerary: ItineraryDay[] = creatorItineraryResult.map((creatorDay, index) => {
        const currentDayDate = new Date(startDate);
        currentDayDate.setDate(startDate.getDate() + index);

        // creatorDay.places (PlaceWithUsedFlag[])를 ItineraryPlaceWithTime[] (@/types 기준)으로 매핑
        // PlaceWithUsedFlag는 Place를 확장하며, use-itinerary-creator는 arriveTime 등을 추가함.
        // ItineraryPlaceWithTime은 Place를 확장하므로, 호환 가능성이 높음. 명시적 캐스팅 사용.
        const mappedPlaces: ItineraryPlaceWithTime[] = creatorDay.places.map(p_creator => {
            return {
                ...p_creator, // id, name, address, x, y, category, arriveTime, timeBlock 등 포함
            } as ItineraryPlaceWithTime; // @/types의 ItineraryPlaceWithTime으로 단언
        });

        // @/types의 ItineraryDay 객체 구성 (모든 필수 필드 포함)
        const coreItineraryDay: ItineraryDay = {
          day: creatorDay.day,
          places: mappedPlaces,
          totalDistance: creatorDay.totalDistance,
          // --- @/types/core.ts ItineraryDay 필수 필드 ---
          dayOfWeek: getDayOfWeekString(currentDayDate),
          date: getDateStringMMDD(currentDayDate),
          routeData: { nodeIds: [], linkIds: [], segmentRoutes: [] }, // 기본값 제공
          interleaved_route: [], // 기본값 제공
        };
        return coreItineraryDay;
      });

      setItinerary(mappedItinerary); // 여기서 setItinerary는 useItinerary 내부의 상태를 업데이트
      setIsItineraryCreated(true);
      setSelectedItineraryDay(1);
      setShowItinerary(true);

      console.log("일정 생성 완료 (useItinerary - generateItinerary):", {
        일수: mappedItinerary.length,
        총장소수: mappedItinerary.reduce((sum, day) => sum + day.places.length, 0),
      });

      return mappedItinerary; // @/types의 ItineraryDay[] 반환
    } catch (error) {
      console.error("일정 생성 오류 (useItinerary - generateItinerary):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return [];
    }
  };

  // handleServerItineraryResponse 함수는 서버에서 이미 @/types/core 기준 ItineraryDay[]를 받는다고 가정.
  // (useScheduleParser.ts에서 그렇게 파싱한다고 되어 있음)
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => { // 매개변수 타입은 @/types의 ItineraryDay[]
    console.log("서버 일정 응답 처리 시작 (useItinerary):", {
      일수: serverItinerary?.length || 0,
      첫날장소수: serverItinerary?.[0]?.places?.length || 0
    });

    if (!serverItinerary || serverItinerary.length === 0) {
      console.warn("[useItinerary] handleServerItineraryResponse: 빈 일정이 전달되었습니다.");
      setItinerary([]);
      setShowItinerary(false);
      setIsItineraryCreated(false);
      return [];
    }

    try {
      // 서버에서 받은 ItineraryDay 객체들이 core.ts의 ItineraryDay 타입과 호환되는지 확인 필요.
      // 특히 routeData와 interleaved_route가 필수이므로, 서버 응답 파싱 시 채워줘야 함.
      // useScheduleParser에서 이 부분을 처리한다고 가정.
      setItinerary(serverItinerary);
      setIsItineraryCreated(true); 
      
      console.log("[useItinerary] handleServerItineraryResponse: 일정 패널 표시 활성화");
      setShowItinerary(true);
      
      if (serverItinerary.length > 0) {
        console.log(`[useItinerary] handleServerItineraryResponse: 첫 번째 일자(${serverItinerary[0].day}) 선택`);
        setSelectedItineraryDay(serverItinerary[0].day);
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
            selectedDay: serverItinerary.length > 0 ? serverItinerary[0].day : null
          }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생");
        window.dispatchEvent(itineraryCreatedEvent);
      }, 100);

      return serverItinerary;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      setIsItineraryCreated(false);
      return serverItinerary;
    }
  };
  
  // createDebugItinerary 함수가 @/types의 ItineraryDay[]를 반환하도록 보장
  const createDebugItinerary = (startDateInput: Date | null): ItineraryDay[] => { // 반환 타입 명시
    const result: ItineraryDay[] = []; // 결과 배열 타입 명시
    const startDate = startDateInput || new Date(); 
    
    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const places: ItineraryPlaceWithTime[] = []; // @/types의 ItineraryPlaceWithTime[]
      for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
        const placeIdNum = 4060000000 + i * 10000 + j * 100;
        const placeIdStr = String(placeIdNum);
        // Place.category는 string, ItineraryPlaceWithTime도 string이므로 영어 카테고리명 사용 가능
        const debugCategory = ['attraction', 'restaurant', 'cafe', 'accommodation'][j % 4];
        places.push({
          id: placeIdStr, 
          name: `디버깅 장소 ${i+1}-${j+1}`,
          address: '제주특별자치도',
          phone: 'N/A',
          category: debugCategory, // Place.category is string
          description: '디버그용 장소 설명',
          rating: 4.0 + Math.random(),
          x: 126.5 + (Math.random() * 0.5 - 0.25),
          y: 33.4 + (Math.random() * 0.5 - 0.25),
          image_url: '',
          road_address: '제주특별자치도 도로명',
          homepage: '',
          timeBlock: `${(9 + j * 2).toString().padStart(2, '0')}:00`, 
          geoNodeId: placeIdStr, 
          arriveTime: `${(9 + j * 2).toString().padStart(2, '0')}:00`,
          departTime: `${(9 + j * 2 + 1).toString().padStart(2, '0')}:00`,
          stayDuration: 60,
          travelTimeToNext: "15분",
        } as ItineraryPlaceWithTime); // 명시적 타입 단언
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
        routeData: { // ItineraryDay.routeData는 필수
          nodeIds: nodeIdsNum.map(String),
          linkIds: linkIdsNum.map(String),
          segmentRoutes: [] 
        },
        interleaved_route: interleavedRouteNum, // ItineraryDay.interleaved_route는 필수
        dayOfWeek: getDayOfWeekString(currentDate), // ItineraryDay.dayOfWeek는 필수
        date: getDateStringMMDD(currentDate), // ItineraryDay.date는 필수
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
        // 서버 응답을 ItineraryDay[] 형태로 파싱
        const parsedItinerary = parseServerResponse(serverResponse);
        console.log("[useItinerary] 서버 응답 파싱 결과:", parsedItinerary);
        
        if (parsedItinerary && parsedItinerary.length > 0) {
          // 파싱된 결과로 상태 업데이트
          setItinerary(parsedItinerary);
          setIsItineraryCreated(true);
          setShowItinerary(true);
          setSelectedItineraryDay(parsedItinerary[0].day);
          
          // itineraryCreated 이벤트 발생
          const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
            detail: { 
              itinerary: parsedItinerary,
              selectedDay: parsedItinerary[0].day
            }
          });
          console.log("[useItinerary] itineraryCreated 이벤트 발생");
          window.dispatchEvent(itineraryCreatedEvent);
        } else {
          console.error("[useItinerary] 서버 응답 파싱 결과가 비어있습니다.");
          toast.error("일정 생성에 실패했습니다. 다시 시도해주세요.");
        }
      } else {
        console.error("[useItinerary] 서버 응답이 유효하지 않습니다:", serverResponse);
        toast.error("서버 응답이 유효하지 않습니다. 다시 시도해주세요.");
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
      console.log("[useItinerary] 'itineraryCreated' 이벤트 수신:", customEvent.detail);
      
      if (customEvent.detail.itinerary && Array.isArray(customEvent.detail.itinerary)) {
        if (customEvent.detail.itinerary.length === 0) {
          console.warn("[useItinerary] 수신된 일정 데이터가 비어 있습니다.");
          setItinerary([]);
          setShowItinerary(false);
          setIsItineraryCreated(false);
          return;
        }
        
        // ItineraryDay 타입 검증 (core.ts 기준 필수 필드 확인)
        const validItinerary = customEvent.detail.itinerary.filter(day => 
          day && 
          typeof day.day === 'number' && 
          day.places && Array.isArray(day.places) &&
          typeof day.dayOfWeek === 'string' && // 필수 필드 확인
          typeof day.date === 'string' &&       // 필수 필드 확인
          day.routeData && typeof day.routeData === 'object' && // 필수 필드 확인
          Array.isArray(day.interleaved_route) // 필수 필드 확인
        );
        
        if (validItinerary.length !== customEvent.detail.itinerary.length) {
          console.warn("[useItinerary] 유효하지 않은 일정 데이터가 포함되어 필터링되었습니다:", {
            originalCount: customEvent.detail.itinerary.length,
            validCount: validItinerary.length,
          });
        }
        
        if (validItinerary.length === 0) {
          console.warn("[useItinerary] 유효한 일정 데이터가 없습니다:", customEvent.detail.itinerary);
          setItinerary([]);
          setShowItinerary(false);
          setIsItineraryCreated(false);
          return;
        }
        
        console.log("[useItinerary] 유효한 일정 데이터로 상태 업데이트:", validItinerary);
        setItinerary(validItinerary);
        setIsItineraryCreated(true);
        setShowItinerary(true);
        
        const dayToSelect = customEvent.detail.selectedDay !== null && validItinerary.find(d => d.day === customEvent.detail.selectedDay)
          ? customEvent.detail.selectedDay
          : (validItinerary.length > 0 ? validItinerary[0].day : null);
        
        setSelectedItineraryDay(dayToSelect);
        
        console.log("[useItinerary] 이벤트에서 상태 업데이트 완료:", {
          일정길이: validItinerary.length,
          선택된일자: dayToSelect,
          일정패널표시: true,
          일정생성됨: true
        });
        
        setTimeout(() => {
          console.log("[useItinerary] 강제 리렌더링 이벤트 발생 (itineraryCreated)");
          window.dispatchEvent(new Event('forceRerender'));
        }, 0); 
      } else {
        console.error("[useItinerary] 이벤트에 유효한 일정 데이터가 없습니다:", customEvent.detail);
        setItinerary([]);
        setShowItinerary(false);
        setIsItineraryCreated(false);
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
