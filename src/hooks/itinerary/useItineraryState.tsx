
import { useState, useEffect, useCallback } from 'react';
import type { ItineraryDay } from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext';

export const useItineraryState = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  
  const { clearAllRoutes } = useMapContext();

  const handleSelectItineraryDay = useCallback((day: number) => {
    console.log(`[useItineraryState] handleSelectItineraryDay called with day: ${day}`);
    setSelectedItineraryDay(day);
    const selectedDayData = itinerary?.find(d => d.day === day);
    if (selectedDayData) {
      console.log(`[useItineraryState] Selected Day ${day} places:`, selectedDayData.places.map(p => ({name: p.name, x: p.x, y: p.y, id: p.id })));
    }
  }, [itinerary]);

  // 일정이 변경되거나 생성될 때 마지막 경로를 지우고 첫 날을 선택
  useEffect(() => {
    if (itinerary && itinerary.length > 0) {
      console.log('[useItineraryState] 새로운 일정이 감지되었습니다.');
      
      // 지도에 남아있는 경로를 초기화
      if (clearAllRoutes) {
        clearAllRoutes();
      }
      
      // 첫 번째 일차를 자동으로 선택 (이미 선택된 일차가 없거나 선택된 일차가 범위를 벗어난 경우)
      if (!selectedItineraryDay || !itinerary.some(day => day.day === selectedItineraryDay)) {
        const firstDay = itinerary[0].day;
        console.log(`[useItineraryState] 첫 번째 일차(${firstDay})를 자동으로 선택합니다.`);
        setSelectedItineraryDay(firstDay);
      } else {
        // 선택된 일차가 있다면 해당 일차를 다시 선택하여 마커 업데이트 트리거
        console.log(`[useItineraryState] 이미 선택된 일차(${selectedItineraryDay})를 유지합니다.`);
        handleSelectItineraryDay(selectedItineraryDay);
      }
    }
  }, [itinerary, selectedItineraryDay, clearAllRoutes, handleSelectItineraryDay]);

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
