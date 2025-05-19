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
