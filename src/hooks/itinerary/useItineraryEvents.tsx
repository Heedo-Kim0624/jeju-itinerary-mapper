import { useEffect } from 'react';
import { toast } from 'sonner';
import type { ItineraryDay, SelectedPlace, NewServerScheduleResponse, SchedulePayload } from '@/types';

interface UseItineraryEventsProps {
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedItineraryDay: (day: number | null) => void;
  setShowItinerary: (show: boolean) => void;
  setIsItineraryCreated: (created: boolean) => void;
  parseServerResponse: (
    serverResponse: NewServerScheduleResponse, 
    selectedPlaces?: SelectedPlace[],
    tripStartDate?: Date | null,
    lastPayload?: SchedulePayload | null
  ) => Promise<ItineraryDay[]>;
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
      selectedPlaces?: SelectedPlace[];
      tripStartDate?: Date | null;
      lastPayload?: SchedulePayload | null;
    }>) => {
      try {
        console.log('[useItineraryEvents] Raw server response event captured:', event.detail);
        
        const { serverResponse, selectedPlaces = [], tripStartDate = null, lastPayload = null } = event.detail;
        
        const parsedItinerary = await parseServerResponse(serverResponse, selectedPlaces, tripStartDate, lastPayload);
        
        console.log('[useItineraryEvents] Parsed itinerary from raw server response:', parsedItinerary);
        
        if (parsedItinerary.length === 0) {
          console.warn('[useItineraryEvents] No itinerary days were parsed from raw server response');
          setItinerary([]);
          setSelectedItineraryDay(null);
          setIsItineraryCreated(false);
          toast.info("생성된 일정이 없습니다.");
          return;
        }
        
        setItinerary(parsedItinerary);
        setShowItinerary(true);
        setIsItineraryCreated(true);
        
        if (parsedItinerary.length > 0 && parsedItinerary[0].day) {
          setSelectedItineraryDay(parsedItinerary[0].day);
        }
        toast.success("여행 일정이 성공적으로 생성되었습니다!");
      } catch (error) {
        console.error('[useItineraryEvents] Error handling raw server response:', error);
        setItinerary([]);
        setSelectedItineraryDay(null);
        setIsItineraryCreated(false);
        toast.error("일정 처리 중 오류가 발생했습니다.");
      }
    };
    
    window.addEventListener('rawServerResponseReceived', handleRawServerResponse as EventListener);
    
    return () => {
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse as EventListener);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated, parseServerResponse]);

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
        
        setTimeout(() => {
          console.log("[useItineraryEvents] 강제 리렌더링 이벤트 발생");
          window.dispatchEvent(new Event('forceRerender'));

          const coordEvent = new CustomEvent('itineraryWithCoordinatesReady', {
            detail: { itinerary: validItinerary }
          });
          console.log("[useItineraryEvents] itineraryWithCoordinatesReady 이벤트 발생");
          window.dispatchEvent(coordEvent);
        }, 0);
      } else {
        console.error("[useItineraryEvents] itineraryCreated 이벤트에 유효한 일정 데이터가 없습니다:", customEvent.detail);
        setItinerary([]); setShowItinerary(true); setIsItineraryCreated(false); setSelectedItineraryDay(null);
      }
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]);
};
