
import { useState, useCallback } from 'react'; // Added useCallback
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';

export type ItineraryDay = CreatorItineraryDay;

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  const handleSelectItineraryDay = useCallback((day: number) => { // Wrapped in useCallback
    setSelectedItineraryDay(day);
  }, []);

  const generateItinerary = useCallback(( // Wrapped in useCallback
    placesToUse: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] | null => {
    try {
      console.log("[use-itinerary] 일정 생성 시작 (클라이언트 측)");
      
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return null;
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
        return null;
      }
      
      console.log("[use-itinerary] 일정 생성 완료, 상태 업데이트");
      
      setItinerary(generatedItinerary);
      // setSelectedItineraryDay(1); // The event 'itineraryCreated' will handle setting the selected day.
                                  // Or, if this function is called directly, this line is fine.
                                  // Let's set it here for direct calls scenario.
      if (generatedItinerary.length > 0 && generatedItinerary[0].day) {
        setSelectedItineraryDay(generatedItinerary[0].day);
      } else {
        setSelectedItineraryDay(null); // Fallback if day is not available
      }
      
      setShowItinerary(true); // Ensure this is called
      
      console.log("[use-itinerary] 일정 상태 업데이트 완료:", {
        일수: generatedItinerary.length,
        총장소수: generatedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: generatedItinerary[0]?.places.map(p => p.name).join(', '),
        showItinerary: true // Reflecting the state set above
      });
      
      return generatedItinerary;
    } catch (error) {
      console.error("[use-itinerary] 클라이언트 측 일정 생성 오류:", error);
      toast.error("클라이언트 측 일정 생성 중 오류가 발생했습니다.");
      return null;
    }
  }, [createItinerary]); // Added createItinerary to dependencies

  const handleServerItineraryResponse = useCallback((serverItinerary: ItineraryDay[]) => { // Wrapped in useCallback
    console.log("서버 일정 응답 처리 (useItinerary):", {
      일수: serverItinerary.length,
      첫날장소수: serverItinerary[0]?.places.length || 0
    });
    
    setItinerary(serverItinerary);
    
    if (serverItinerary.length > 0 && serverItinerary[0].day) {
      setSelectedItineraryDay(serverItinerary[0].day);
    } else {
      setSelectedItineraryDay(null);
    }
    
    setShowItinerary(true);
    
    return serverItinerary;
  }, []);

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary,
    handleServerItineraryResponse
  };
};
