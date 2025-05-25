
import { useCallback } from 'react';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { EventEmitter } from '@/hooks/events/useEventEmitter';

export const useMapDaySelector = () => {
  const { selectedDay: selectedDayFromStore, setSelectedDay } = useRouteMemoryStore();
  
  // 일자 선택 핸들러
  const handleDaySelect = useCallback((day: number) => {
    // 이미 선택된 일자면 무시
    if (selectedDayFromStore === day) return;
    
    console.log(`[useMapDaySelector] 일자 ${day} 선택`);
    
    // 경로 메모리 상태 업데이트
    setSelectedDay(day);
    
    // 경로 및 마커 렌더링 이벤트 발생
    EventEmitter.emit('mapDayChanged', { day });
    
    console.log(`[useMapDaySelector] mapDayChanged 이벤트 발생됨 (일자: ${day})`);
  }, [selectedDayFromStore, setSelectedDay]);
  
  return {
    selectedDayFromUI: selectedDayFromStore,
    handleDaySelect
  };
};
