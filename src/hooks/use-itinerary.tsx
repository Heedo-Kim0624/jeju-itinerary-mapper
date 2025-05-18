
import { useState } from 'react';
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator'; // Keep alias if original ItineraryDay is also from here
import { toast } from 'sonner';

// Export ItineraryDay, ensuring it matches the type from use-itinerary-creator
export type ItineraryDay = CreatorItineraryDay;

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  const generateItinerary = (
    placesToUse: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => { // 반환 타입을 ItineraryDay[] | null에서 ItineraryDay[]로 변경
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return []; // null 대신 빈 배열 반환
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
        return []; // null 대신 빈 배열 반환
      }

      setItinerary(generatedItinerary);
      setSelectedItineraryDay(1); // Default to day 1
      setShowItinerary(true);

      console.log("일정 생성 완료 (useItinerary):", {
        일수: generatedItinerary.length,
        총장소수: generatedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: generatedItinerary[0]?.places.map(p => p.name).join(', ')
      });

      return generatedItinerary;
    } catch (error) {
      console.error("일정 생성 오류 (useItinerary):", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return []; // null 대신 빈 배열 반환
    }
  };

  // 서버 응답 처리 함수 - 개선된 로직
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => {
    console.log("서버 일정 응답 처리 시작 (useItinerary):", {
      일수: serverItinerary?.length || 0,
      첫날장소수: serverItinerary?.[0]?.places?.length || 0
    });

    if (!serverItinerary || serverItinerary.length === 0) {
      console.warn("[useItinerary] handleServerItineraryResponse: 빈 일정이 전달되었습니다.");
      return [];
    }

    try {
      // 먼저 일정 데이터 설정
      setItinerary(serverItinerary);
      
      // 명시적으로 일정 패널 표시 활성화 - 이 부분은 중요합니다!
      console.log("[useItinerary] handleServerItineraryResponse: 일정 패널 표시 활성화");
      setShowItinerary(true);
      
      // 첫 번째 일자 선택
      if (serverItinerary.length > 0) {
        console.log(`[useItinerary] handleServerItineraryResponse: 첫 번째 일자(${serverItinerary[0].day}) 선택`);
        setSelectedItineraryDay(serverItinerary[0].day);
      }

      // 강제 렌더링 및 이벤트 발생을 위해 setTimeout 사용
      // 이렇게 하면 상태 업데이트가 먼저 적용된 후 이벤트가 발생합니다
      setTimeout(() => {
        console.log("[useItinerary] handleServerItineraryResponse: forceRerender 이벤트 발생");
        window.dispatchEvent(new Event('forceRerender'));
        
        // itineraryWithCoordinatesReady 이벤트 발생
        const event = new CustomEvent('itineraryWithCoordinatesReady', {
          detail: { itinerary: serverItinerary }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryWithCoordinatesReady 이벤트 발생");
        window.dispatchEvent(event);

        // 새로운 일정 생성 완료 이벤트 발생
        const itineraryCreatedEvent = new CustomEvent('itineraryCreated', {
          detail: { 
            itinerary: serverItinerary,
            selectedDay: serverItinerary.length > 0 ? serverItinerary[0].day : null
          }
        });
        console.log("[useItinerary] handleServerItineraryResponse: itineraryCreated 이벤트 발생");
        window.dispatchEvent(itineraryCreatedEvent);
      }, 100);

      return serverItinerary;
    } catch (error) {
      console.error("[useItinerary] handleServerItineraryResponse 처리 중 오류:", error);
      return serverItinerary;
    }
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary,
    handleServerItineraryResponse // Keep this function
  };
};
