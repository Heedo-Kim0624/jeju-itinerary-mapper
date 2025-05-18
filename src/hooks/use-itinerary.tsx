
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
  ): ItineraryDay[] | null => { // Return type explicitly ItineraryDay[]
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return null;
      }
    
      const generatedItinerary: ItineraryDay[] = createItinerary( // Ensure type consistency
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
      return null;
    }
  };

  // 서버 응답 처리 함수 (from user's Part 1, ensuring it's kept)
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => {
    console.log("서버 일정 응답 처리 (useItinerary):", {
      일수: serverItinerary.length,
      첫날장소수: serverItinerary[0]?.places.length || 0
    });
    
    setItinerary(serverItinerary);
    
    if (serverItinerary.length > 0) {
      setSelectedItineraryDay(serverItinerary[0].day);
    }
    
    setShowItinerary(true);
    
    return serverItinerary;
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

