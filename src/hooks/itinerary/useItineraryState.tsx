
import { useState, useEffect } from 'react';
import type { ItineraryDay } from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext';

export const useItineraryState = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  
  const { clearAllRoutes } = useMapContext();

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
    const selectedDayData = itinerary?.find(d => d.day === day);
    if (selectedDayData) {
      console.log(`[useItineraryState] Selected Day ${day} places:`, selectedDayData.places.map(p => ({name: p.name, x: p.x, y: p.y, id: p.id })));
    }
  };

  // 일정이 변경되거나 생성될 때 마지막 경로를 지우고 첫 날을 선택
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !selectedItineraryDay) {
      console.log('[useItineraryState] 새로운 일정이 생성되었습니다. 첫 번째 일차를 선택합니다.');
      
      // 지도에 남아있는 경로를 초기화
      if (clearAllRoutes) {
        clearAllRoutes();
      }
      
      // 첫 번째 일차 선택
      const firstDay = itinerary[0].day;
      setSelectedItineraryDay(firstDay);
    }
  }, [itinerary, selectedItineraryDay, clearAllRoutes]);

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
  };
};
