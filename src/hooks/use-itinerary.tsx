import { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';

export type ItineraryDay = CreatorItineraryDay;

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
          // Don't toast here if runner already toasted. Or, make toasts consistent.
          // toast.warning("생성된 일정이 없습니다. 다시 시도해 주세요.");
          setItinerary([]); // Set to empty array instead of null to indicate "processed but empty"
          setIsItineraryCreated(true); // It was "created" (processed), just empty
          setShowItinerary(false); // Hide panel if itinerary is empty
          setSelectedItineraryDay(null);
          return;
        }
        
        // Basic validation for structure (can be more thorough)
        const validItinerary = customEvent.detail.itinerary.filter(day => 
          day && typeof day.day === 'number' && Array.isArray(day.places)
          // Removed day.places.length > 0 check to allow days with no places if that's valid
        );
        
        if (validItinerary.length === 0 && customEvent.detail.itinerary.length > 0) {
          console.warn("[useItinerary] 수신된 일정에 유효한 일자 데이터가 없습니다:", customEvent.detail.itinerary);
          // toast.warning("유효한 일정 데이터가 없습니다. 다시 시도해 주세요.");
          setItinerary([]);
          setIsItineraryCreated(true);
          setShowItinerary(false);
          setSelectedItineraryDay(null);
          return;
        }
        
        console.log("[useItinerary] 유효한 일정 데이터로 상태 업데이트:", validItinerary);
        setItinerary(validItinerary);
        setIsItineraryCreated(true); // Mark as created
        setShowItinerary(true); // Show the panel
        
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
        
        // forceRerender is typically dispatched by the runner after this event.
        // If not, dispatching it here can be an option.
        // setTimeout(() => {
        //   console.log("[useItinerary] 강제 리렌더링 이벤트 발생 (타이머)");
        //   window.dispatchEvent(new Event('forceRerender'));
        // }, 100); // A small delay
      } else {
        console.error("[useItinerary] 이벤트에 유효한 itinerary 데이터가 없습니다:", customEvent.detail);
      }
    };
    
    const handleItineraryWithCoords = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[] }>;
      console.log("[useItinerary] itineraryWithCoordinatesReady 이벤트 수신:", customEvent.detail);
      if (customEvent.detail && customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        // This event might re-affirm the itinerary.
        // Only update if it's different or if current itinerary is null.
        // For simplicity, let's assume itineraryCreated is the primary source.
        // This could potentially cause a loop if not handled carefully.
        // Let's ensure it does not unset a valid itinerary.
        if (!itinerary || itinerary.length === 0) {
             setItinerary(customEvent.detail.itinerary);
             if (selectedItineraryDay === null) {
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
  }, [itinerary, setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]); 
  
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

      const generatedItinerary: ItineraryDay[] = createItinerary(
        placesToUse,
        startDate,
        endDate,
        startTime,
        endTime
      );

      if (generatedItinerary.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return [];
      }
      
      // Dispatch event for client-side generated itinerary
      // This ensures the same flow as server-generated ones
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

      return generatedItinerary; // Return for direct use if needed by caller
    } catch (error) {
      console.error("클라이언트 일정 생성 오류 (useItinerary):", error);
      toast.error("클라이언트 일정 생성 중 오류가 발생했습니다.");
      return [];
    }
  };

  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => {
    console.log("서버 일정 응답 직접 처리 (useItinerary - POSSIBLY DEPRECATED):", serverItinerary);
    if (!serverItinerary || serverItinerary.length === 0) {
      return [];
    }
    // This should also dispatch 'itineraryCreated' event
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
