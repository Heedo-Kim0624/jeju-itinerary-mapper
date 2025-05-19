import { useState, useEffect } from 'react';
import { Place } from '@/types/supabase'; // Assuming Place from supabase is compatible or use Place from @/types
import { 
    ItineraryDay as GlobalItineraryDay, 
    ItineraryPlaceWithTime as GlobalItineraryPlaceWithTime,
    RouteData // Import RouteData
} from '@/types'; // Use the global type from index.ts
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator'; // This is from the read-only file
import { toast } from 'sonner';

// Export the global types so other files use the consistent definition
export type ItineraryDay = GlobalItineraryDay;
export type ItineraryPlaceWithTime = GlobalItineraryPlaceWithTime;

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
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null); // Uses global ItineraryDay
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false); // Added state
  const { createItinerary } = useItineraryCreator();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  const generateItinerary = (
    placesToUse: Place[], // Ensure this Place type is compatible
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => { // Returns global ItineraryDay[]
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return [];
      }

      // createItinerary returns CreatorItineraryDayTypeOnly[]
      const creatorItineraryResult: ReturnType<typeof createItinerary> = createItinerary(
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

      // Map CreatorItineraryDayTypeOnly[] to global ItineraryDay[]
      const mappedItinerary: ItineraryDay[] = creatorItineraryResult.map((creatorDay, index) => {
        const currentDayDate = new Date(startDate);
        currentDayDate.setDate(startDate.getDate() + index); 

        const mappedPlaces = (creatorDay.places as ItineraryPlaceWithTime[]).map(p => ({
          ...p,
        }));

        return {
          ...creatorDay, 
          places: mappedPlaces,
          dayOfWeek: getDayOfWeekString(currentDayDate),
          date: getDateStringMMDD(currentDayDate),
          // Ensure routeData is compliant with the new ItineraryDay type
          routeData: (creatorDay as any).routeData || { nodeIds: [], linkIds: [], segmentRoutes: [] },
          interleaved_route: (creatorDay as any).interleaved_route || [],
        };
      });

      setItinerary(mappedItinerary);
      setIsItineraryCreated(true); // Set created flag
      setSelectedItineraryDay(1); // Default to day 1
      setShowItinerary(true);

      console.log("일정 생성 완료 (useItinerary):", {
        일수: mappedItinerary.length,
        총장소수: mappedItinerary.reduce((sum, day) => sum + day.places.length, 0),
      });

      return mappedItinerary;
    } catch (error) {
      console.error("일정 생성 오류 (useItinerary):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return [];
    }
  };

  // 서버 응답 처리 함수 - 개선된 로직
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => { // Expects global ItineraryDay[]
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
            selectedDay: serverItinerary.length > 0 ? serverItinerary[0].day : null,
            showItinerary: true // Ensure event carries showItinerary true
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

  // Debugging function within useItinerary
  const createDebugItinerary = (startDateInput: Date | null): ItineraryDay[] => { // startDate can be null
    const result: ItineraryDay[] = [];
    const startDate = startDateInput || new Date(); 
    
    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const places: ItineraryPlaceWithTime[] = [];
      for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
        const placeIdNum = 4060000000 + i * 10000 + j * 100;
        const placeIdStr = String(placeIdNum);
        places.push({
          id: placeIdStr, 
          name: `디버깅 장소 ${i+1}-${j+1}`,
          address: '제주특별자치도',
          phone: 'N/A',
          category: ['attraction', 'restaurant', 'cafe', 'accommodation'][j % 4],
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
        });
      }
      
      const nodeIdsNumStr = places.map(p => String(p.id)); // Ensure string for RouteData
      const linkIdsNumStr: string[] = [];
      for (let j = 0; j < nodeIdsNumStr.length - 1; j++) {
        linkIdsNumStr.push(String(5060000000 + i * 10000 + j * 100)); // Ensure string
      }
      
      const interleavedRouteMixed: (string | number)[] = [];
      for (let j = 0; j < nodeIdsNumStr.length; j++) {
        interleavedRouteMixed.push(nodeIdsNumStr[j]); // string
        if (j < linkIdsNumStr.length) {
          interleavedRouteMixed.push(linkIdsNumStr[j]); // string
        }
      }

      result.push({
        day: i + 1,
        places: places,
        totalDistance: parseFloat((10 + Math.random() * 20).toFixed(2)),
        routeData: { // Conforms to new RouteData
          nodeIds: nodeIdsNumStr,
          linkIds: linkIdsNumStr,
          segmentRoutes: [] 
        },
        interleaved_route: interleavedRouteMixed, 
        dayOfWeek: getDayOfWeekString(currentDate),
        date: getDateStringMMDD(currentDate),
      });
    }
    return result;
  };

  // useEffect for itineraryCreated event listener
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null, showItinerary: boolean }>; // Added showItinerary to detail
      console.log("[useItinerary] 'itineraryCreated' 이벤트 수신:", customEvent.detail);
      
      const { itinerary: eventItinerary, selectedDay: eventSelectedDay, showItinerary: eventShowItinerary } = customEvent.detail;

      if (eventItinerary && Array.isArray(eventItinerary)) {
        if (eventItinerary.length === 0 && !eventShowItinerary) { // If explicitly told not to show or empty
          console.warn("[useItinerary] 수신된 일정 데이터가 비어 있고, 표시하지 않도록 지시받았습니다.");
          setItinerary([]);
          setShowItinerary(false);
          setIsItineraryCreated(false);
          setSelectedItineraryDay(null);
          return;
        }
        
        const validItinerary = eventItinerary.filter(day => 
          day && typeof day.day === 'number' && day.places && Array.isArray(day.places)
        );
        
        setItinerary(validItinerary); // Update itinerary even if empty, if showItinerary is true
        setIsItineraryCreated(validItinerary.length > 0);
        setShowItinerary(eventShowItinerary); // Use showItinerary from event detail
        
        const dayToSelect = eventSelectedDay !== null && validItinerary.find(d => d.day === eventSelectedDay)
          ? eventSelectedDay
          : (validItinerary.length > 0 ? validItinerary[0].day : null);
        
        setSelectedItineraryDay(dayToSelect);
        
        console.log("[useItinerary] 이벤트에서 상태 업데이트 완료:", {
          일정길이: validItinerary.length,
          선택된일자: dayToSelect,
          일정패널표시: eventShowItinerary,
          일정생성됨: validItinerary.length > 0
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
        setSelectedItineraryDay(null);
      }
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]); // Dependencies kept simple

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    isItineraryCreated, // expose this state
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated, // expose setter
    handleSelectItineraryDay,
    generateItinerary,
    handleServerItineraryResponse,
    createDebugItinerary // expose for debugging if needed
  };
};
