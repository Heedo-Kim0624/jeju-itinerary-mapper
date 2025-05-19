import { useState, useEffect, useCallback } from 'react';
import { Place } from '@/types/supabase';
import { 
    ItineraryDay as GlobalItineraryDay, 
    ItineraryPlaceWithTime as GlobalItineraryPlaceWithTime,
    RouteData 
} from '@/types';
import { useItineraryCreator } from './use-itinerary-creator';
import { toast } from 'sonner';
import { convertToStandardItineraryDay } from '@/utils/type-converters';

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
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]); // Initialize with empty array
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  // Standard function name for selecting a day
  const handleSelectItineraryDay = useCallback((day: number) => { // Renamed from onDaySelect, made useCallback
    setSelectedItineraryDay(day);
  }, []);

  const generateItinerary = useCallback((
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

      const creatorItineraryResult = createItinerary(
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
      
      // Use convertToStandardItineraryDay for mapping
      const mappedItinerary = convertToStandardItineraryDay(creatorItineraryResult, startDate);

      setItinerary(mappedItinerary);
      setIsItineraryCreated(true); 
      setSelectedItineraryDay(mappedItinerary.length > 0 ? mappedItinerary[0].day : null); 
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
  }, [createItinerary]); // Added createItinerary to dependencies

  const handleServerItineraryResponse = useCallback((serverItinerary: ItineraryDay[]) => { 
    console.log("서버 일정 응답 처리 시작 (useItinerary):", {
      일수: serverItinerary?.length || 0,
      첫날장소수: serverItinerary?.[0]?.places?.length || 0
    });

    if (!serverItinerary || serverItinerary.length === 0) {
      console.warn("[useItinerary] handleServerItineraryResponse: 빈 일정이 전달되었습니다.");
      setItinerary([]); 
      setShowItinerary(false); 
      setIsItineraryCreated(false); 
      setSelectedItineraryDay(null); // Clear selected day
      return []; 
    }

    try {
      // Ensure serverItinerary conforms to ItineraryDay[] fully before setting
      const standardizedItinerary = convertToStandardItineraryDay(serverItinerary, serverItinerary[0]?.date ? new Date(serverItinerary[0].date) : new Date());

      setItinerary(standardizedItinerary);
      setIsItineraryCreated(true); 
      
      console.log("[useItinerary] handleServerItineraryResponse: 일정 패널 표시 활성화");
      setShowItinerary(true);
      
      if (standardizedItinerary.length > 0) {
        const dayToSelect = standardizedItinerary[0].day;
        console.log(`[useItinerary] handleServerItineraryResponse: 첫 번째 일자(${dayToSelect}) 선택`);
        setSelectedItineraryDay(dayToSelect);
      } else {
        setSelectedItineraryDay(null);
      }

      setTimeout(() => {
        console.log("[useItinerary] handleServerItineraryResponse: forceRerender 이벤트 발생");
        window.dispatchEvent(new Event('forceRerender'));
        
        const event = new CustomEvent('itineraryWithCoordinatesReady', {
          detail: { itinerary: standardizedItinerary }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryWithCoordinatesReady 이벤트 발생");
        window.dispatchEvent(event);

        const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
          detail: { 
            itinerary: standardizedItinerary,
            selectedDay: standardizedItinerary.length > 0 ? standardizedItinerary[0].day : null,
            showItinerary: true 
          }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생");
        window.dispatchEvent(itineraryCreatedEvent);
      }, 100);

      return standardizedItinerary;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      setItinerary([]); // Clear itinerary on error
      setShowItinerary(false);
      setIsItineraryCreated(false); 
      setSelectedItineraryDay(null);
      return []; // Return empty array on error
    }
  }, []); // Empty dependency array if convertToStandardItineraryDay is pure

  // Debugging function within useItinerary
  const createDebugItinerary = useCallback((startDateInput: Date | null): ItineraryDay[] => {
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
      
      const nodeIdsNumStr = places.map(p => String(p.id)); 
      const linkIdsNumStr: string[] = [];
      for (let j = 0; j < nodeIdsNumStr.length - 1; j++) {
        linkIdsNumStr.push(String(5060000000 + i * 10000 + j * 100)); 
      }
      
      const interleavedRouteMixed: (string | number)[] = [];
      for (let j = 0; j < nodeIdsNumStr.length; j++) {
        interleavedRouteMixed.push(nodeIdsNumStr[j]); 
        if (j < linkIdsNumStr.length) {
          interleavedRouteMixed.push(linkIdsNumStr[j]); 
        }
      }

      result.push({
        day: i + 1,
        places: places,
        totalDistance: parseFloat((10 + Math.random() * 20).toFixed(2)),
        routeData: { 
          nodeIds: nodeIdsNumStr,
          linkIds: linkIdsNumStr,
          segmentRoutes: [] 
        },
        interleaved_route: interleavedRouteMixed, 
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()], // simplified
        date: `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}`, // simplified
      });
    }
    return result;
  }, []);

  useEffect(() => {
    const handleItineraryCreatedListener = (event: Event) => { // Renamed to avoid conflict
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null, showItinerary: boolean }>;
      console.log("[useItinerary] 'itineraryCreated' 이벤트 수신:", customEvent.detail);
      
      const { itinerary: eventItinerary, selectedDay: eventSelectedDay, showItinerary: eventShowItinerary } = customEvent.detail;

      if (eventItinerary && Array.isArray(eventItinerary)) {
        // Standardize incoming event itinerary
        const standardizedEventItinerary = convertToStandardItineraryDay(eventItinerary, eventItinerary[0]?.date ? new Date(eventItinerary[0].date) : new Date());

        if (standardizedEventItinerary.length === 0 && !eventShowItinerary) { 
          console.warn("[useItinerary] 수신된 일정 데이터가 비어 있고, 표시하지 않도록 지시받았습니다.");
          setItinerary([]);
          setShowItinerary(false);
          setIsItineraryCreated(false);
          setSelectedItineraryDay(null);
          return;
        }
        
        setItinerary(standardizedEventItinerary); 
        setIsItineraryCreated(standardizedEventItinerary.length > 0);
        setShowItinerary(eventShowItinerary); 
        
        const dayToSelect = eventSelectedDay !== null && standardizedEventItinerary.find(d => d.day === eventSelectedDay)
          ? eventSelectedDay
          : (standardizedEventItinerary.length > 0 ? standardizedEventItinerary[0].day : null);
        
        setSelectedItineraryDay(dayToSelect);
        
        console.log("[useItinerary] 이벤트에서 상태 업데이트 완료:", {
          일정길이: standardizedEventItinerary.length,
          선택된일자: dayToSelect,
          일정패널표시: eventShowItinerary,
          일정생성됨: standardizedEventItinerary.length > 0
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
    
    window.addEventListener('itineraryCreated', handleItineraryCreatedListener);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreatedListener);
    };
  }, []); 

  return {
    itinerary,
    selectedItineraryDay, // Use this name
    showItinerary,
    isItineraryCreated,
    setItinerary,
    setSelectedItineraryDay, // Use this name
    setShowItinerary,
    setIsItineraryCreated,
    handleSelectItineraryDay, // Use this name
    // onDaySelect: handleSelectItineraryDay, // Keep if other components use onDaySelect from this hook
    generateItinerary,
    handleServerItineraryResponse,
    createDebugItinerary
  };
};
