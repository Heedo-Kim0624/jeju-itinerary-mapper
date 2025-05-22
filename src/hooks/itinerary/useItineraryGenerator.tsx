import { useState, useCallback } from 'react';
import { useItineraryCreator } from '@/hooks/use-itinerary-creator';
import type { Place, ItineraryDay } from '@/types/core'; // ItineraryDay from core
import { useTripDetails } from '@/hooks/use-trip-details';

export const useItineraryGenerator = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const { dates, startTime, endTime } = useTripDetails();
  const { createItineraryFromPlaces } = useItineraryCreator(); // Use the correct destructured name

  const generateItinerary = useCallback((currentPlaces: Place[]): ItineraryDay[] | null => {
    if (!currentPlaces || currentPlaces.length === 0) {
      console.warn("일정을 생성할 장소가 없습니다.");
      return null;
    }

    if (!dates?.startDate || !dates?.endDate || !startTime || !endTime) {
      console.error("날짜 또는 시간 정보가 누락되어 일정을 생성할 수 없습니다.");
      return null;
    }

    try {
      const newItinerary = createItineraryFromPlaces( // Use the correct function name
        currentPlaces,
        dates.startDate,
        dates.endDate,
        startTime,
        endTime
      );
      setItinerary(newItinerary);
      console.log("새로운 일정 생성됨:", newItinerary);
      return newItinerary;
    } catch (error) {
      console.error("일정 생성 중 오류 발생:", error);
      return null;
    }
  }, [dates, startTime, endTime, createItineraryFromPlaces, setItinerary]);

  return { itinerary, generateItinerary, setItinerary };
};
