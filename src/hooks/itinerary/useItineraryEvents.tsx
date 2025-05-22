import { useEffect } from 'react';
import { toast } from 'sonner';
import type { ItineraryDay, CoreSelectedPlace, NewServerScheduleResponse } from '@/types';

interface UseItineraryEventsProps {
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedItineraryDay: (day: number | null) => void;
  setShowItinerary: (show: boolean) => void;
  setIsItineraryCreated: (created: boolean) => void;
  parseServerResponse: (
    serverResponse: NewServerScheduleResponse, 
    selectedPlaces?: CoreSelectedPlace[],
    tripStartDate?: Date | null
  ) => Promise<ItineraryDay[]>; // Promise 반환 타입으로 수정
}

export const useItineraryEvents = ({
  setItinerary,
  setSelectedItineraryDay,
  setShowItinerary,
  setIsItineraryCreated,
  parseServerResponse,
}: UseItineraryEventsProps) => {
  useEffect(() => {
    const handleRawServerResponse = async (event: CustomEvent<{
      serverResponse: NewServerScheduleResponse;
      selectedPlaces?: CoreSelectedPlace[];
      tripStartDate?: Date | null;
    }>) => {
      try {
        console.log('[useItineraryEvents] Raw server response event captured:', event.detail);
        
        const { serverResponse, selectedPlaces = [], tripStartDate = null } = event.detail;
        
        // parseServerResponse가 이제 Promise를 반환하므로 await로 처리
        const parsedItinerary = await parseServerResponse(serverResponse, selectedPlaces, tripStartDate);
        
        console.log('[useItineraryEvents] Parsed itinerary from raw server response:', parsedItinerary);
        
        if (parsedItinerary.length === 0) {
          console.warn('[useItineraryEvents] No itinerary days were parsed from raw server response');
          setItinerary([]);
          setSelectedItineraryDay(null);
          setIsItineraryCreated(false);
          return;
        }
        
        setItinerary(parsedItinerary);
        setShowItinerary(true);
        setIsItineraryCreated(true);
        
        // Select the first day automatically
        if (parsedItinerary.length > 0 && parsedItinerary[0].day) {
          setSelectedItineraryDay(parsedItinerary[0].day);
        }
      } catch (error) {
        console.error('[useItineraryEvents] Error handling raw server response:', error);
        setItinerary([]);
        setSelectedItineraryDay(null);
        setIsItineraryCreated(false);
      }
    };
    
    window.addEventListener('rawServerResponseReceived', handleRawServerResponse as EventListener);
    
    return () => {
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse as EventListener);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated, parseServerResponse]); // Dependencies for event handler closure

  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null }>;
      console.log("[useItineraryEvents] 'itineraryCreated' 이벤트 최종 수신:", customEvent.detail);
      
      const receivedItinerary = customEvent.detail.itinerary;

      if (receivedItinerary && Array.isArray(receivedItinerary)) {
        if (receivedItinerary.length === 0) {
          console.warn("[useItineraryEvents] 수신된 일정 데이터가 비어 있습니다.");
          setItinerary([]);
          setShowItinerary(true); 
          setIsItineraryCreated(false); 
          setSelectedItineraryDay(null);
          // Consider a toast here if not already handled by the dispatcher of this event
          // toast.info("생성된 일정이 없습니다.");
          return;
        }
        
        // Basic validation, similar to original
        const validItinerary = receivedItinerary.filter(day => 
          day && 
          typeof day.day === 'number' && 
          day.places && Array.isArray(day.places) &&
          // Ensuring coordinates are valid numbers is crucial for map rendering
          day.places.every(p => typeof p.x === 'number' && typeof p.y === 'number' && !isNaN(p.x) && !isNaN(p.y)) &&
          typeof day.dayOfWeek === 'string' && 
          typeof day.date === 'string' &&       
          day.routeData && typeof day.routeData === 'object' && 
          Array.isArray(day.interleaved_route) 
        );
        
        if (validItinerary.length !== receivedItinerary.length) {
          console.warn("[useItineraryEvents] 유효하지 않거나 좌표가 없는 일정 데이터가 포함되어 필터링되었습니다:", {
            originalCount: receivedItinerary.length, validCount: validItinerary.length,
          });
        }
        
        if (validItinerary.length === 0) {
          console.warn("[useItineraryEvents] 유효한 일정 데이터가 없습니다. 원본:", receivedItinerary);
          setItinerary([]); setShowItinerary(true); setIsItineraryCreated(false); setSelectedItineraryDay(null);
          return;
        }
        
        setItinerary(validItinerary);
        setIsItineraryCreated(true);
        setShowItinerary(true);
        
        let dayToSelect = customEvent.detail.selectedDay;
        if (dayToSelect === null || !validItinerary.find(d => d.day === dayToSelect)) {
            dayToSelect = validItinerary.length > 0 ? validItinerary[0].day : null;
        }
        setSelectedItineraryDay(dayToSelect);
        
        console.log("[useItineraryEvents] 상태 업데이트 완료:", {
          일정길이: validItinerary.length, 선택된일자: dayToSelect,
        });
        
        // Dispatch downstream events after state is set
        setTimeout(() => {
          console.log("[useItineraryEvents] 강제 리렌더링 이벤트 발생");
          window.dispatchEvent(new Event('forceRerender'));

          const coordEvent = new CustomEvent('itineraryWithCoordinatesReady', {
            detail: { itinerary: validItinerary }
          });
          console.log("[useItineraryEvents] itineraryWithCoordinatesReady 이벤트 발생");
          window.dispatchEvent(coordEvent);
        }, 0); // setTimeout to allow React to process state updates first
      } else {
        console.error("[useItineraryEvents] itineraryCreated 이벤트에 유효한 일정 데이터가 없습니다:", customEvent.detail);
        setItinerary([]); setShowItinerary(true); setIsItineraryCreated(false); setSelectedItineraryDay(null);
      }
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]); // Dependencies for event handler closure
};
