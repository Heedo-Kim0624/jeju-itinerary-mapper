import { toast } from 'sonner';
import type { ItineraryDay, Place, SelectedPlace as CoreSelectedPlace } from '@/types'; // CoreSelectedPlace 추가

import { useItineraryState } from './itinerary/useItineraryState';
import { useItineraryParser } from './itinerary/useItineraryParser'; // 경로 수정
import { useItineraryGenerator } from './itinerary/useItineraryGenerator';
import { useItineraryEvents } from './itinerary/useItineraryEvents';
// useScheduleStore import 추가 (가이드에는 없었지만, parseServerResponse에서 사용될 수 있음)
// 만약 useScheduleStore가 이 파일에서 직접 사용되지 않는다면, 이 import는 필요 없습니다.
// useItineraryParser 내부에서 currentSelectedPlaces를 인자로 받으므로,
// 이 파일에서는 useScheduleStore를 직접 참조할 필요가 없을 수 있습니다.
// import { useScheduleStore } from '@/store/useScheduleStore';

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

  // useItineraryParser hook 사용법 수정
  const itineraryParser = useItineraryParser(); 

  const { generateItinerary, createDebugItinerary } = useItineraryGenerator({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
  });

  // useItineraryEvents에 parseServerResponse 함수 전달 시, 올바른 함수를 전달하도록 수정
  useItineraryEvents({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
    parseServerResponse: itineraryParser.parseServerResponse, // 수정된 부분
  });
  
  const handleServerItineraryResponse = (
    serverItineraryData: any, // 서버 응답은 any 타입으로 유지하고, 파서에서 처리
    currentSelectedPlaces: CoreSelectedPlace[] // currentSelectedPlaces 인자 추가
  ): ItineraryDay[] => {
    console.log("서버 일정 응답 처리 시작 (useItinerary):", {
      일수: serverItineraryData?.schedule?.length || 0, // serverItineraryData가 실제 서버 응답 객체라고 가정
    });

    // itineraryParser.parseServerResponse를 사용하여 파싱
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
