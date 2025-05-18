
import { useState, useEffect } from 'react';
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

  // 이벤트 핸들러 등록: itineraryCreated 이벤트 처리
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ 
        itinerary: ItineraryDay[]; 
        selectedDay: number | null 
      }>;
      
      console.log("[useItinerary] itineraryCreated 이벤트 수신:", customEvent.detail);
      
      if (customEvent.detail && customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        // 일정과 선택된 날짜 설정
        setItinerary(customEvent.detail.itinerary);
        
        if (customEvent.detail.selectedDay !== null) {
          setSelectedItineraryDay(customEvent.detail.selectedDay);
        } else {
          setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
        }
        
        // 명시적으로 일정 패널 표시 활성화
        setShowItinerary(true);
        
        console.log("[useItinerary] 이벤트 처리 후 상태:", {
          일정길이: customEvent.detail.itinerary.length,
          선택된날짜: customEvent.detail.selectedDay || customEvent.detail.itinerary[0].day,
          패널표시여부: true
        });
      }
    };
    
    // itineraryWithCoordinatesReady 이벤트도 처리합니다
    const handleItineraryWithCoords = (event: Event) => {
      const customEvent = event as CustomEvent<{
        itinerary: ItineraryDay[];
      }>;
      
      console.log("[useItinerary] itineraryWithCoordinatesReady 이벤트 수신");
      
      if (customEvent.detail && customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        // 일정 설정 (이미 itineraryCreated에서 처리했을 수 있으나 보장을 위해)
        setItinerary(customEvent.detail.itinerary);
        
        // 선택된 날짜가 없다면 첫째 날을 선택
        if (selectedItineraryDay === null) {
          setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
        }
        
        // 일정 패널 표시 활성화를 명시적으로 설정
        setShowItinerary(true);
      }
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    window.addEventListener('itineraryWithCoordinatesReady', handleItineraryWithCoords);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 해제
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
      window.removeEventListener('itineraryWithCoordinatesReady', handleItineraryWithCoords);
    };
  }, [selectedItineraryDay]);
  
  // 상태 동기화를 위한 추가 useEffect - 일정이 생성되었지만 패널이 표시되지 않는 경우를 처리
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
      }, 200); // 타이머를 좀 더 길게 설정

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
