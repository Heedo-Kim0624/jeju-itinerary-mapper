import { useState, useEffect, useCallback } from 'react';
import { ItineraryDay } from '@/types/schedule'; // Uses schedule.ts ItineraryDay
import { toast } from 'sonner';

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
      
      const { itinerary: newItinerary, selectedDay: newSelectedDay } = event.detail as { itinerary: ItineraryDay[], selectedDay: number | null };
      
      if (newItinerary && Array.isArray(newItinerary)) { // Allow empty array to reset
        setItinerary(newItinerary);
        setSelectedItineraryDay(newSelectedDay !== null ? newSelectedDay : (newItinerary[0]?.day || null));
        setShowItinerary(newItinerary.length > 0); // Show if not empty
        setIsItineraryCreated(newItinerary.length > 0); // Created if not empty
        
        console.log("[useItinerary] 일정 데이터가 UI에 반영되었습니다:", {
          일정길이: newItinerary.length,
          선택된일자: newSelectedDay !== null ? newSelectedDay : (newItinerary[0]?.day || null),
          일정패널표시: newItinerary.length > 0,
          일정생성됨: newItinerary.length > 0
        });
      } else {
        console.error("[useItinerary] 'itineraryCreated' event: 일정 데이터가 유효하지 않습니다.", event.detail);
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

  const handleSelectItineraryDay = useCallback((day: number) => {
    console.log("[useItinerary] 일정 날짜 선택:", day);
    setSelectedItineraryDay(day);
  }, [setSelectedItineraryDay]);

  // This function was in the original file, keeping it for now.
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
    setItinerary,
    selectedItineraryDay,
    setSelectedItineraryDay,
    showItinerary,
    setShowItinerary,
    isItineraryCreated,
    setIsItineraryCreated,
    handleSelectItineraryDay,
    handleServerItineraryResponse 
  };
};
