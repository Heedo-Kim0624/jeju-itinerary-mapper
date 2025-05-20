
import { toast } from 'sonner';
import type { ItineraryDay, Place, SelectedPlace as CoreSelectedPlace } from '@/types'; // CoreSelectedPlace 추가

import { useItineraryState } from './itinerary/useItineraryState';
import { useItineraryParser } from './itinerary/useItineraryParser'; // 경로 수정
import { useItineraryGenerator } from './itinerary/useItineraryGenerator';
import { useItineraryEvents } from './itinerary/useItineraryEvents';
// useScheduleStore import 추가
import { useScheduleStore } from '@/store/useScheduleStore'; // Assuming this store exists and provides selectedPlaces

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

  const itineraryParser = useItineraryParser(); 
  const { selectedPlaces: currentSelectedPlacesFromStore } = useScheduleStore(); // Get selected places from store

  const { generateItinerary, createDebugItinerary } = useItineraryGenerator({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
  });

  // useItineraryEvents에 parseServerResponse 함수 전달 시, 래퍼 함수 사용
  useItineraryEvents({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
    parseServerResponse: (serverResponse: any) => { 
      // Wrapper function to match the expected signature.
      // It uses currentSelectedPlacesFromStore from the hook's scope.
      return itineraryParser.parseServerResponse(serverResponse, currentSelectedPlacesFromStore || []);
    },
  });
  
  const handleServerItineraryResponse = (
    serverItineraryData: any, // 서버 응답은 any 타입으로 유지하고, 파서에서 처리
    currentSelectedPlaces: CoreSelectedPlace[] // currentSelectedPlaces 인자 추가
  ): ItineraryDay[] => {
    console.log("서버 일정 응답 처리 시작 (useItinerary):", {
      일수: serverItineraryData?.schedule?.length || 0,
    });

    // itineraryParser.parseServerResponse를 사용하여 파싱
    // This call is correct as currentSelectedPlaces is passed directly as an argument
    const parsedItinerary = itineraryParser.parseServerResponse(serverItineraryData, currentSelectedPlaces);

    if (!parsedItinerary || parsedItinerary.length === 0) {
      console.warn("[useItinerary] handleServerItineraryResponse: 파싱된 일정이 없습니다.");
      toast.info("생성된 일정이 없습니다. 다른 조건으로 시도해보세요.");
      const event = new CustomEvent('itineraryCreated', {
        detail: { itinerary: [], selectedDay: null }
      });
      window.dispatchEvent(event);
      return []; 
    }

    try {
      let dayToSelectInitial: number | null = null;
      if (parsedItinerary.length > 0) {
        dayToSelectInitial = parsedItinerary[0].day || 1;
      }

      const event = new CustomEvent('itineraryCreated', {
        detail: { 
          itinerary: parsedItinerary,
          selectedDay: dayToSelectInitial 
        }
      });
      console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생");
      window.dispatchEvent(event);
      
      return parsedItinerary;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      toast.error("일정 처리 중 오류가 발생했습니다.");
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
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
    handleSelectItineraryDay,
    generateItinerary,
    handleServerItineraryResponse,
    createDebugItinerary,
  };
};

