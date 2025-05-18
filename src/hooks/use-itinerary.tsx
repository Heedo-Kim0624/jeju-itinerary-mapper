import { useState, useEffect, useCallback } from 'react';
import { ItineraryDay } from '@/types/schedule'; // Uses schedule.ts ItineraryDay
import { toast } from 'sonner';

// ItineraryDay 타입을 재내보내기
export type { ItineraryDay } from '@/types/schedule';

export const useItinerary = () => {
  const [itinerary, setItineraryInternal] = useState<ItineraryDay[]>([]);
  const [selectedItineraryDay, setSelectedItineraryDayInternal] = useState<number | null>(null);
  const [showItinerary, setShowItineraryInternal] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreatedInternal] = useState<boolean>(false);

  const setItinerary = useCallback((newItinerary: ItineraryDay[] | ((prevState: ItineraryDay[]) => ItineraryDay[])) => {
    console.log("[useItinerary] setItinerary called with:", newItinerary);
    setItineraryInternal(newItinerary);
  }, [setItineraryInternal]);

  const setSelectedItineraryDay = useCallback((day: number | null | ((prevState: number | null) => number | null)) => {
    console.log("[useItinerary] setSelectedItineraryDay called with:", day);
    setSelectedItineraryDayInternal(day);
  }, [setSelectedItineraryDayInternal]);

  const setShowItinerary = useCallback((show: boolean | ((prevState: boolean) => boolean)) => {
    console.log("[useItinerary] setShowItinerary called with:", show);
    setShowItineraryInternal(show);
  }, [setShowItineraryInternal]);

  const setIsItineraryCreated = useCallback((created: boolean | ((prevState: boolean) => boolean)) => {
    console.log("[useItinerary] setIsItineraryCreated called with:", created);
    setIsItineraryCreatedInternal(created);
  }, [setIsItineraryCreatedInternal]);

  useEffect(() => {
    const handleItineraryCreated = (event: CustomEvent) => {
      console.log("[useItinerary] 'itineraryCreated' event received:", event.detail);
      
      const { itinerary: newItinerary, selectedDay } = event.detail as { itinerary: ItineraryDay[], selectedDay: number | null }; // 타입 단언 추가
      
      if (newItinerary && Array.isArray(newItinerary)) { // Allow empty array to reset
        setItinerary(newItinerary);
        setSelectedItineraryDay(selectedDay !== null ? selectedDay : (newItinerary[0]?.day || null));
        setShowItinerary(newItinerary.length > 0); // Show if not empty
        setIsItineraryCreated(newItinerary.length > 0); // Created if not empty
        
        console.log("[useItinerary] 일정 데이터가 UI에 반영되었습니다:", {
          일정길이: newItinerary.length,
          선택된일자: selectedDay !== null ? selectedDay : (newItinerary[0]?.day || null),
          일정패널표시: newItinerary.length > 0,
          일정생성됨: newItinerary.length > 0
        });
      } else {
        console.error("[useItinerary] 'itineraryCreated' event: 일정 데이터가 유효하지 않습니다.", event.detail);
        // 기존에 있던 오류 토스트 메시지 제거 또는 조건부 표시
        // toast.error("일정 데이터가 비어있거나 유효하지 않습니다."); 
      }
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated as EventListener);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated as EventListener);
    };
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated]);

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: isItineraryCreated,
      일정패널표시: showItinerary,
      선택된일자: selectedItineraryDay,
      일정길이: itinerary.length,
      로딩상태: false // Assuming loading state is handled elsewhere
    });
  }, [isItineraryCreated, showItinerary, selectedItineraryDay, itinerary]);

  const handleSelectItineraryDay = useCallback((day: number) => { // 함수 이름 변경 (handleDaySelect -> handleSelectItineraryDay) 사용자 제안과 일치
    console.log("[useItinerary] 일정 날짜 선택:", day);
    setSelectedItineraryDay(day);
  }, [setSelectedItineraryDay]);

  // generateItinerary 함수 추가 (누락된 경우) - 사용자 제안
  const generateItinerary = useCallback(async (payload: any) => {
    // 구현 또는 다른 훅에서 가져오기
    console.log("[useItinerary] generateItinerary called with payload:", payload);
    // 실제 구현은 프롬프트 2에서 다룰 예정 (현재는 플레이스홀더)
    toast.info("generateItinerary 함수가 호출되었지만, 아직 구현되지 않았습니다.");
    return Promise.resolve(null); // 임시 반환
  }, []);
  
  // This function was in the original file, keeping it for now.
  // It might need to be adjusted or removed depending on how generateItinerary is fully implemented.
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => {
    console.log("서버 일정 응답 직접 처리 (useItinerary):", serverItinerary);
    setItinerary(serverItinerary);
    if (serverItinerary.length > 0) {
      setSelectedItineraryDay(serverItinerary[0].day);
    }
    setShowItinerary(true);
    setIsItineraryCreated(true);
    return serverItinerary;
  };

  return {
    itinerary,
    setItinerary, // 내부 상태 변경 함수도 반환
    selectedItineraryDay,
    setSelectedItineraryDay, // 내부 상태 변경 함수도 반환
    showItinerary,
    setShowItinerary, // 내부 상태 변경 함수도 반환
    isItineraryCreated,
    setIsItineraryCreated, // 내부 상태 변경 함수도 반환
    handleSelectItineraryDay, // 이름 변경된 핸들러
    generateItinerary, // 추가된 함수
    handleServerItineraryResponse // 기존 함수 유지
  };
};
