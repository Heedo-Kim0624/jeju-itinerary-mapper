
import { toast } from 'sonner';
import type { ItineraryDay, Place } from '@/types'; // Ensure Place is imported if generateItinerary needs it explicitly

import { useItineraryState } from './itinerary/useItineraryState';
import { useItineraryParser } from './itinerary/useItineraryParser';
import { useItineraryGenerator } from './itinerary/useItineraryGenerator';
import { useItineraryEvents } from './itinerary/useItineraryEvents';

export const useItinerary = () => {
  const {
    itinerary,
    setItinerary,
    selectedItineraryDay,
    setSelectedItineraryDay,
    showItinerary,
    setShowItinerary,
    isItineraryCreated,
    setIsItineraryCreated,
    handleSelectItineraryDay,
  } = useItineraryState();

  const { parseServerResponse } = useItineraryParser();

  const { generateItinerary, createDebugItinerary } = useItineraryGenerator({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
  });

  useItineraryEvents({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
    parseServerResponse,
  });

  // This function is kept for compatibility if it was intended to be called directly
  // with an already parsed ItineraryDay[] array.
  // It now primarily dispatches the 'itineraryCreated' event, and the listener handles state.
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]): ItineraryDay[] => {
    console.log("서버 일정 응답 처리 시작 (useItinerary - refactored):", {
      일수: serverItinerary?.length || 0,
      첫날장소수: serverItinerary?.[0]?.places?.length || 0,
    });

    if (!serverItinerary || serverItinerary.length === 0) {
      console.warn("[useItinerary] handleServerItineraryResponse: 빈 일정이 전달되었습니다.");
      toast.info("생성된 일정이 없습니다. 다른 조건으로 시도해보세요.");
      // Dispatch event with empty itinerary so listeners can react (e.g., clear UI)
      const event = new CustomEvent('itineraryCreated', {
        detail: { itinerary: [], selectedDay: null }
      });
      window.dispatchEvent(event);
      return []; 
    }

    try {
      // Determine selected day based on the first day of the received itinerary
      let dayToSelectInitial: number | null = null;
      if (serverItinerary.length > 0) {
        dayToSelectInitial = serverItinerary[0].day || 1; // Default to 1 if day prop is missing/falsy
      }

      const event = new CustomEvent('itineraryCreated', {
        detail: { 
          itinerary: serverItinerary,
          selectedDay: dayToSelectInitial 
        }
      });
      console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생 (from handleServerItineraryResponse)");
      window.dispatchEvent(event);
      
      // Note: Downstream events like 'forceRerender' and 'itineraryWithCoordinatesReady'
      // are now dispatched by the 'itineraryCreated' event listener in useItineraryEvents.
      // This centralizes the handling of a "completed" itinerary.

      return serverItinerary;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      toast.error("일정 처리 중 오류가 발생했습니다.");
      // Dispatch event with empty itinerary on error
      const errorEvent = new CustomEvent('itineraryCreated', {
        detail: { itinerary: [], selectedDay: null }
      });
      window.dispatchEvent(errorEvent);
      return []; 
    }
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    isItineraryCreated,
    setItinerary, // Exporting setters for external control if needed
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
    handleSelectItineraryDay,
    generateItinerary, // From useItineraryGenerator
    handleServerItineraryResponse,
    createDebugItinerary, // From useItineraryGenerator
  };
};
