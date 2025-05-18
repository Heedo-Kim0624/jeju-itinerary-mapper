
import { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';

export type ItineraryDay = CreatorItineraryDay; // This exports the type from use-itinerary-creator

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]); // Initialize with empty array
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  useEffect(() => {
    console.log("[useItinerary] itinerary 상태 변경:", {
      itinerary존재여부: itinerary && itinerary.length > 0,
      itinerary길이: itinerary?.length || 0,
      첫날day값: itinerary && itinerary.length > 0 && itinerary[0] ? itinerary[0].day : null,
      selectedDay: selectedItineraryDay,
      showItinerary: showItinerary,
    });
  }, [itinerary, selectedItineraryDay, showItinerary]);

  const handleSelectItineraryDay = useCallback((day: number) => {
    console.log(`[useItinerary] ${day}일차 선택`);
    setSelectedItineraryDay(day);
  }, []);

  const generateItinerary = useCallback(( 
    placesToUse: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] | null => {
    try {
      console.log("[use-itinerary] 클라이언트 측 일정 생성 시작");
      
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
      
      console.log("[use-itinerary] 클라이언트 측 일정 생성 완료, 상태 업데이트:", {
        일수: generatedItinerary.length,
        일자목록: generatedItinerary.map(day => day.day),
        총장소수: generatedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: generatedItinerary[0]?.places.map(p => p.name).join(', ')
      });
      
      setItinerary(generatedItinerary);
      if (generatedItinerary.length > 0 && generatedItinerary[0].day != null) {
        setSelectedItineraryDay(generatedItinerary[0].day);
      } else {
         setSelectedItineraryDay(null); // Fallback if day is not available
      }
      setShowItinerary(true);
      
      console.log("[use-itinerary] 클라이언트 측 일정 상태 업데이트 완료:", {
        일수: generatedItinerary.length,
        showItinerary: true 
      });
      
      return generatedItinerary;
    } catch (error) {
      console.error("[use-itinerary] 클라이언트 측 일정 생성 오류:", error);
      toast.error("클라이언트 측 일정 생성 중 오류가 발생했습니다.");
      return null;
    }
  }, [createItinerary]);

  // This function is called when 'itineraryCreated' event is dispatched
  // or if server response needs to be handled directly by use-itinerary (less common now)
  const handleServerItineraryResponse = useCallback((serverItinerary: ItineraryDay[], newSelectedDay?: number | null) => {
    console.log("[useItinerary] 서버/이벤트 일정 응답 처리:", {
      일수: serverItinerary.length,
      첫날장소수: serverItinerary[0]?.places.length || 0,
      newSelectedDay: newSelectedDay
    });
    
    setItinerary(serverItinerary);
    
    if (newSelectedDay !== null && newSelectedDay !== undefined) {
        setSelectedItineraryDay(newSelectedDay);
    } else if (serverItinerary.length > 0 && serverItinerary[0].day != null) {
      setSelectedItineraryDay(serverItinerary[0].day);
    } else {
      setSelectedItineraryDay(null);
    }
    
    setShowItinerary(true); // Ensure itinerary panel is shown
    
    return serverItinerary;
  }, []);

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary, // Keep this for direct manipulation if needed elsewhere, though event is preferred
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary, // For client-side fallback
    handleServerItineraryResponse // For event handling primarily
  };
};
