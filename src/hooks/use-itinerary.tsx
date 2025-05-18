
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
  // const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false); // 이 상태는 현재 사용되지 않는 것으로 보입니다.
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
      // setIsItineraryCreated(true); // 이 상태 업데이트는 현재 isItineraryCreated 상태가 사용되지 않으므로 주석 처리합니다.
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

  // 서버 응답 처리 함수 (from user's Part 1, ensuring it's kept)
  const handleServerItineraryResponse = (serverItinerary: ItineraryDay[]) => {
    console.log("서버 일정 응답 처리 (useItinerary):", {
      일수: serverItinerary.length,
      첫날장소수: serverItinerary[0]?.places.length || 0
    });

    setItinerary(serverItinerary);
    // setIsItineraryCreated(true); // 이 상태 업데이트는 현재 isItineraryCreated 상태가 사용되지 않으므로 주석 처리합니다.

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
    // isItineraryCreated, // 이 상태는 현재 사용되지 않으므로 반환 객체에서 제거 또는 주석 처리합니다.
    setItinerary,
    // setIsItineraryCreated, // 이 상태 설정 함수도 함께 제거 또는 주석 처리합니다.
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary,
    handleServerItineraryResponse // Keep this function
  };
};
