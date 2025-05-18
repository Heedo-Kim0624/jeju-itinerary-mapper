import { useState, useCallback, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay as CreatorItineraryDay } from './use-itinerary-creator';
import { toast } from 'sonner';

export type ItineraryDay = CreatorItineraryDay;

export const useItinerary = () => {
  // Initialize with empty array instead of null for better type consistency
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

  // Monitoring itinerary state changes for debugging
  useEffect(() => {
    console.log("[useItinerary] itinerary state changed:", {
      hasItinerary: itinerary.length > 0,
      itineraryLength: itinerary.length,
      firstDayValue: itinerary.length > 0 ? itinerary[0].day : null,
      selectedDay: selectedItineraryDay
    });
    
    // Auto-select first day if we have itinerary but no day selected
    if (itinerary.length > 0 && selectedItineraryDay === null) {
      const firstDay = itinerary[0].day;
      console.log(`[useItinerary] Auto-selecting first day: ${firstDay}`);
      setSelectedItineraryDay(firstDay);
    }
  }, [itinerary, selectedItineraryDay]);

  const handleSelectItineraryDay = useCallback((day: number) => {
    console.log(`[useItinerary] Selecting day: ${day}`);
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
      
      console.log("[use-itinerary] 일정 생성 완료, 상태 업데이트:", {
        dayCount: generatedItinerary.length,
        dayValues: generatedItinerary.map(day => day.day),
        totalPlaces: generatedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        firstDayPlaces: generatedItinerary[0]?.places.map(p => p.name).join(', ')
      });
      
      // Update state
      setItinerary(generatedItinerary);
      
      // Select first day or keep current selection if valid
      if (generatedItinerary.length > 0) {
        const firstDay = generatedItinerary[0].day;
        const validDays = generatedItinerary.map(day => day.day);
        
        if (selectedItineraryDay === null || !validDays.includes(selectedItineraryDay)) {
          setSelectedItineraryDay(firstDay);
          console.log(`[useItinerary] Setting first day as selected: ${firstDay}`);
        }
      }
      
      setShowItinerary(true);
      
      return generatedItinerary;
    } catch (error) {
      console.error("[use-itinerary] 클라이언트 측 일정 생성 오류:", error);
      toast.error("클라이언트 측 일정 생성 중 오류가 발생했습니다.");
      return null;
    }
  }, [createItinerary, selectedItineraryDay]);

  const handleServerItineraryResponse = useCallback((serverItinerary: ItineraryDay[]) => {
    console.log("[useItinerary] 서버 일정 응답 처리:", {
      dayCount: serverItinerary.length,
      dayValues: serverItinerary.map(day => day.day),
      firstDayPlaceCount: serverItinerary[0]?.places.length || 0
    });
    
    setItinerary(serverItinerary);
    
    if (serverItinerary.length > 0) {
      const firstDay = serverItinerary[0].day;
      const validDays = serverItinerary.map(day => day.day);
      
      if (selectedItineraryDay === null || !validDays.includes(selectedItineraryDay)) {
        setSelectedItineraryDay(firstDay);
        console.log(`[useItinerary] Setting first day as selected from server response: ${firstDay}`);
      }
    } else {
      setSelectedItineraryDay(null);
    }
    
    setShowItinerary(true);
    
    return serverItinerary;
  }, [selectedItineraryDay]);

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
