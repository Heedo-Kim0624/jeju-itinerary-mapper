import { toast } from 'sonner';
import type { ItineraryDay, Place, SelectedPlace as CoreSelectedPlace, NewServerScheduleResponse } from '@/types'; // CoreSelectedPlace 추가, NewServerScheduleResponse 추가

import { useItineraryState } from './itinerary/useItineraryState';
import { useItineraryParser } from './itinerary/useItineraryParser'; 
import { useItineraryGenerator } from './itinerary/useItineraryGenerator';
import { useItineraryEvents } from './itinerary/useItineraryEvents';
import { validateItineraryData, summarizeItineraryData } from '@/utils/debugUtils'; // 디버그 유틸리티 임포트

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

  const itineraryParserHook = useItineraryParser(); // Hook 이름 변경

  const { generateItinerary, createDebugItinerary } = useItineraryGenerator({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
  });

  // useItineraryEvents에 전달되는 parseServerResponse는 이제 사용되지 않거나,
  // useItineraryParserHook.parseServerResponse를 직접 사용하도록 변경되어야 합니다.
  // 현재 useItineraryEvents는 rawServerResponseReceived 이벤트를 직접 처리하지 않으므로,
  // 이 부분은 새로운 흐름에 맞춰 조정될 필요가 있습니다. 여기서는 일단 기존 구조를 유지합니다.
  useItineraryEvents({
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    setIsItineraryCreated,
    parseServerResponse: (serverResponse: NewServerScheduleResponse, _selectedPlaces?: CoreSelectedPlace[], tripStartDate?: Date | null) => { // _selectedPlaces is unused
      // Pass only serverResponse and tripStartDate as per the updated signature
      return itineraryParserHook.parseServerResponse(serverResponse, tripStartDate || null);
    },
  });
  
  const handleServerItineraryResponse = (
    parsedItineraryDays: ItineraryDay[] // 입력 타입을 파싱된 ItineraryDay[]로 변경
  ): ItineraryDay[] => {
    console.log("[useItinerary] handleServerItineraryResponse 시작. 전달된 일정:", summarizeItineraryData(parsedItineraryDays));
    
    const validation = validateItineraryData(parsedItineraryDays);
    if (!validation.valid) {
      console.error("[useItinerary] 전달된 일정 데이터 유효성 검사 실패:", validation.issues);
      toast.error(`일정 데이터에 문제가 있습니다: ${validation.issues.join(', ')}`);
      // 유효하지 않은 데이터로 상태를 업데이트하지 않거나, 빈 일정으로 처리
      setItinerary([]);
      setShowItinerary(false); // 또는 true로 두고 빈 일정 메시지 표시
      setIsItineraryCreated(false);
      setSelectedItineraryDay(null);
      // 필요시 에러 이벤트 발생
      return []; 
    }

    if (!parsedItineraryDays || parsedItineraryDays.length === 0 || parsedItineraryDays.every(day => day.places.length === 0)) {
      console.warn("[useItinerary] handleServerItineraryResponse: 유효하지만 장소가 없는 빈 일정이거나 모든 날에 장소가 없습니다.");
      toast.info("개발자가 일정 생성 서버를 열지 않아서 일정 생성이 불가합니다. 상주 인원에게 문의부탁드립니다!!.");
      setItinerary(parsedItineraryDays); // 빈 일정이라도 상태는 반영
      setShowItinerary(true); // 패널은 보여주되, 내용이 없음을 표시
      setIsItineraryCreated(true); // 생성은 되었다고 간주 (빈 일정으로)
      setSelectedItineraryDay(null);
      
      const event = new CustomEvent('itineraryCreated', {
        detail: { itinerary: parsedItineraryDays, selectedDay: null, totalPlaces: 0 }
      });
      window.dispatchEvent(event);
      return parsedItineraryDays; 
    }

    try {
      console.log("[useItinerary] 상태 업데이트 전 기존 itinerary:", summarizeItineraryData(itinerary));
      
      setItinerary(parsedItineraryDays);
      setIsItineraryCreated(true); 
      setShowItinerary(true);
      
      let dayToSelectInitial: number | null = null;
      if (parsedItineraryDays.length > 0 && parsedItineraryDays[0].day) {
        dayToSelectInitial = parsedItineraryDays[0].day;
        console.log(`[useItinerary] handleServerItineraryResponse: 첫 번째 일자(${dayToSelectInitial}) 자동 선택`);
        setSelectedItineraryDay(dayToSelectInitial);
      } else {
        setSelectedItineraryDay(null);
      }

      console.log("[useItinerary] 상태 업데이트 후 (예상):", {
        itinerarySummary: summarizeItineraryData(parsedItineraryDays),
        isItineraryCreated: true,
        showItinerary: true,
        selectedItineraryDay: dayToSelectInitial
      });

      // 이벤트 발생을 약간 지연시켜 DOM 업데이트 시간을 확보
      setTimeout(() => {
        console.log("[useItinerary] handleServerItineraryResponse: forceRerender 이벤트 발생 시도");
        window.dispatchEvent(new Event('forceRerender'));
        
        const totalPlaces = parsedItineraryDays.reduce((sum, day) => sum + day.places.length, 0);
        const eventDetail = { 
          itinerary: parsedItineraryDays,
          selectedDay: dayToSelectInitial,
          totalPlaces: totalPlaces
        };

        const itineraryWithCoordsEvent = new CustomEvent('itineraryWithCoordinatesReady', { detail: eventDetail });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryWithCoordinatesReady 이벤트 발생", eventDetail);
        window.dispatchEvent(itineraryWithCoordsEvent);

        const itineraryCreatedEvent = new CustomEvent('itineraryCreated', { detail: eventDetail });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생", eventDetail);
        window.dispatchEvent(itineraryCreatedEvent);
      }, 100);
      
      return parsedItineraryDays;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      toast.error("일정 처리 중 오류가 발생했습니다.");
      // 오류 발생 시에도 상태를 초기화하거나 이전 상태로 되돌릴 수 있음
      setItinerary([]);
      setIsItineraryCreated(false);
      setShowItinerary(false);
      setSelectedItineraryDay(null);
      
      const errorEvent = new CustomEvent('itineraryCreated', {
        detail: { itinerary: [], selectedDay: null, error: true } // 에러 플래그 추가
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
    handleServerItineraryResponse, // 수정된 함수
    createDebugItinerary,
  };
};
