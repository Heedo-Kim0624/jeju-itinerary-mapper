
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ItineraryDay } from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext';

export const useItineraryState = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);
  const lastEventDispatchTimestamp = useRef<number>(0); // 이벤트 방출 타임스탬프 추적
  
  const { clearAllRoutes } = useMapContext();

  // 일정 일자 선택 핸들러 개선
  const handleSelectItineraryDay = useCallback((day: number) => {
    console.log(`[useItineraryState] handleSelectItineraryDay called with day: ${day}`);
    
    // 일자 상태 업데이트
    setSelectedItineraryDay(day);
    
    const now = Date.now();
    const selectedDayData = itinerary?.find(d => d.day === day);
    
    if (selectedDayData) {
      console.log(`[useItineraryState] Selected Day ${day} places:`, selectedDayData.places.map(p => ({name: p.name, x: p.x, y: p.y, id: p.id })));
      
      // 이벤트 디바운싱 - 너무 빠른 연속 이벤트 방지 (300ms)
      if (now - lastEventDispatchTimestamp.current > 300) {
        lastEventDispatchTimestamp.current = now;
        
        // 명확한 이름의 커스텀 이벤트 발생
        const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
          detail: { 
            day, 
            timestamp: now,
            placesCount: selectedDayData.places.length
          } 
        });
        
        console.log(`[useItineraryState] Dispatching itineraryDaySelected event for day ${day} with ${selectedDayData.places.length} places`);
        // 비동기로 이벤트 실행하여 상태 업데이트와 동시에 발생하는 문제 방지
        setTimeout(() => {
          window.dispatchEvent(daySelectedEvent);
        }, 0);
      }
    } else {
      console.warn(`[useItineraryState] Selected day ${day} not found in itinerary`);
    }
  }, [itinerary]);

  // 일정이 변경되면 경로 지우고 첫째 날 선택
  useEffect(() => {
    if (itinerary && itinerary.length > 0) {
      console.log('[useItineraryState] 새로운 일정이 감지되었습니다.');
      
      // 경로 초기화
      if (clearAllRoutes) {
        clearAllRoutes();
      }
      
      // 선택된 일자 확인 및 필요시 첫날 자동 선택
      const validSelectedDay = selectedItineraryDay !== null && 
                              itinerary.some(day => day.day === selectedItineraryDay);
                              
      if (!validSelectedDay) {
        const firstDay = itinerary[0].day;
        console.log(`[useItineraryState] 첫 번째 일차(${firstDay})를 자동으로 선택합니다.`);
        setSelectedItineraryDay(firstDay);
        
        // 일정 첫날 자동 선택 이벤트 발생 (약간 지연)
        setTimeout(() => {
          const firstDaySelectedEvent = new CustomEvent('itineraryDaySelected', { 
            detail: { 
              day: firstDay, 
              timestamp: Date.now(),
              initialSelection: true
            } 
          });
          window.dispatchEvent(firstDaySelectedEvent);
          console.log(`[useItineraryState] 일정 로드 후 자동 첫째날(${firstDay}) 선택 이벤트 발행`);
        }, 100);
      } else {
        // 기존 선택일 유지하고 재선택 이벤트 발생
        console.log(`[useItineraryState] 이미 선택된 일차(${selectedItineraryDay})를 유지합니다.`);
        
        // 마커 및 경로 새로고침을 위한 재선택 이벤트
        setTimeout(() => {
          handleSelectItineraryDay(selectedItineraryDay);
        }, 50);
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
