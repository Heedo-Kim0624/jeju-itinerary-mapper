
import { useState } from 'react';
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';

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
  ) => {
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return null;
      }
    
      const generatedItinerary = createItinerary(
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
      setSelectedItineraryDay(1);
      setShowItinerary(true);
      
      console.log("일정 생성 완료:", {
        일수: generatedItinerary.length,
        총장소수: generatedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: generatedItinerary[0]?.places.map(p => p.name).join(', ')
      });
      
      return generatedItinerary;
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return null;
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
    generateItinerary
  };
};
