import { useState, useEffect } from 'react';
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types';
import { useItineraryCreator } from './use-itinerary-creator';
import { toast } from 'sonner';

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null }>;
      console.log("[useItinerary] 'itineraryCreated' 이벤트 수신:", customEvent.detail);
      
      if (customEvent.detail && customEvent.detail.itinerary && Array.isArray(customEvent.detail.itinerary)) {
        // Itinerary can be empty if generation failed but event is still fired
        if (customEvent.detail.itinerary.length === 0) {
          console.warn("[useItinerary] 수신된 일정 데이터가 비어 있습니다.");
          // toast.warning("생성된 일정이 없습니다. 다시 시도해 주세요."); // Runner should handle this
          setItinerary([]); 
          setIsItineraryCreated(true); 
          setShowItinerary(false); 
          setSelectedItineraryDay(null);
          return;
        }
        
        // Basic validation for structure (can be more thorough)
        // Ensure new ItineraryDay structure is validated (e.g. dayOfWeek, date, routeData)
        const validItinerary = customEvent.detail.itinerary.filter(day => 
          day && 
          typeof day.day === 'number' && 
          Array.isArray(day.places) &&
          typeof day.dayOfWeek === 'string' && // Added validation
          typeof day.date === 'string' && // Added validation
          typeof day.routeData === 'object' && // Added validation
          Array.isArray(day.routeData.nodeIds) && // Added validation
          Array.isArray(day.routeData.linkIds) // Added validation
        );
        
        if (validItinerary.length === 0 && customEvent.detail.itinerary.length > 0) {
          console.warn("[useItinerary] 수신된 일정에 유효한 일자 데이터가 없습니다:", customEvent.detail.itinerary);
          // toast.warning("유효한 일정 데이터가 없습니다. 다시 시도해 주세요."); // Runner should handle
          setItinerary([]);
          setIsItineraryCreated(true);
          setShowItinerary(false);
          setSelectedItineraryDay(null);
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

      } else {
        console.error("[useItinerary] 이벤트에 유효한 itinerary 데이터가 없습니다:", customEvent.detail);
      }
    };
    
    const handleItineraryWithCoords = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[] }>;
      console.log("[useItinerary] itineraryWithCoordinatesReady 이벤트 수신:", customEvent.detail);
      if (customEvent.detail && customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        // Only update if it's different or if current itinerary is null.
        if (!itinerary || itinerary.length === 0) { // Check current state `itinerary`
             setItinerary(customEvent.detail.itinerary);
             if (selectedItineraryDay === null && customEvent.detail.itinerary.length > 0) { // Check current selectedDay
                setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
             }
             setShowItinerary(true);
        }
      }
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    window.addEventListener('itineraryWithCoordinatesReady', handleItineraryWithCoords);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
      window.removeEventListener('itineraryWithCoordinatesReady', handleItineraryWithCoords);
    };
  }, [itinerary, selectedItineraryDay, setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]); // Added selectedItineraryDay to dependencies
  
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !showItinerary) {
      console.log("[useItinerary] 일정이 존재하나 패널이 표시되지 않아 자동 활성화");
      setShowItinerary(true);
    }
  }, [itinerary, showItinerary]);

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
      // createItinerary might return a different ItineraryDay structure (CreatorItineraryDay)
      // If so, it needs to be mapped to the centralized ItineraryDay.
      // For now, assuming createItinerary is updated or its output is compatible.
      const generatedItineraryInternal = createItinerary(
        placesToUse,
        startDate,
        endDate,
        startTime,
        endTime
      );

      // TODO: Map generatedItineraryInternal to ItineraryDay[] if types differ significantly.
      // This is a placeholder for potential mapping. If CreatorItineraryDay is already compatible, this can be simpler.
      const generatedItinerary: ItineraryDay[] = generatedItineraryInternal.map(day => ({
        ...day, // Spread existing properties from CreatorItineraryDay
        // Ensure all fields of the new ItineraryDay are present
        dayOfWeek: day.dayOfWeek || 'N/A', // Add default or derive if not present
        date: day.date || 'N/A', // Add default or derive if not present
        routeData: day.routeData || { nodeIds: [], linkIds: [] }, // Add default
        interleaved_route: day.interleaved_route || [], // Ensure it's number[]
        places: day.places.map(p => ({ // Ensure ItineraryPlaceWithTime fields
            ...p,
            phone: p.phone || '',
            description: p.description || '',
            rating: p.rating || 0,
            image_url: p.image_url || '',
            road_address: p.road_address || '',
            homepage: p.homepage || '',
            // Ensure other Place fields if ItineraryPlaceWithTime extends Place directly
        })) as ItineraryPlaceWithTime[],
      }));


      if (generatedItinerary.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return [];
      }
      
      const event = new CustomEvent('itineraryCreated', { 
        detail: { 
          itinerary: generatedItinerary,
          selectedDay: generatedItinerary.length > 0 ? generatedItinerary[0].day : null
        } 
      });
      window.dispatchEvent(event);
      
      console.log("클라이언트 일정 생성 완료 및 이벤트 발생 (useItinerary):", {
        일수: generatedItinerary.length,
      });

      return generatedItinerary;
    } catch (error) {
      console.error("클라이언트 일정 생성 오류 (useItinerary):", error);
      toast.error("클라이언트 일정 생성 중 오류가 발생했습니다.");
      return [];
    }
  };

  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => {
    console.log("서버 일정 응답 직접 처리 (useItinerary - POSSIBLY DEPRECATED):", serverItinerary);
    if (!serverItinerary || serverItinerary.length === 0) {
      // toast.error("서버 응답이 비어있습니다."); // Consider if toast is needed here
      return []; // Return empty array to signify no data
    }
    const event = new CustomEvent('itineraryCreated', {
      detail: { 
        itinerary: serverItinerary,
        selectedDay: serverItinerary.length > 0 ? serverItinerary[0].day : null
      }
    });
    window.dispatchEvent(event);
    return serverItinerary;
  };

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
    handleServerItineraryResponse
  };
};
