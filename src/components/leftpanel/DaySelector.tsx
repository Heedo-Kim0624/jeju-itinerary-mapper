import React, { useCallback, useEffect, useRef } from 'react'; // useEffect, useRef 추가
import { Button } from '@/components/ui/button';
import { ItineraryDay } from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext';

interface DaySelectorProps {
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({
  itinerary,
  selectedDay,
  onSelectDay,
}) => {
  const { startDayRendering } = useMapContext();
  const prevSelectedDayRef = useRef<number | null>(null);
  
  // 컴포넌트 마운트 시 또는 selectedDay가 변경될 때 마커 갱신 로직 실행
  useEffect(() => {
    // selectedDay가 유효하고 이전 값과 다른 경우에만 실행
    if (selectedDay !== null && selectedDay !== prevSelectedDayRef.current) {
      console.log(`[DaySelector] selectedDay changed to ${selectedDay}, triggering marker update`);
      
      // 마커 갱신 프로세스 시작
      startDayRendering(selectedDay);
      
      // 이벤트 발생
      window.dispatchEvent(new CustomEvent('itineraryDaySelected', { 
        detail: { day: selectedDay, timestamp: Date.now() } 
      }));
      console.log(`[DaySelector] Dispatched 'itineraryDaySelected' event for day ${selectedDay}`);
      
      // 현재 값을 ref에 저장
      prevSelectedDayRef.current = selectedDay;
    }
  }, [selectedDay, startDayRendering]);

  const handleDayClick = useCallback((day: number) => {
    console.log(`[DaySelector] Day ${day} selected by user.`);
    
    // 상위 컴포넌트에 일자 변경 알림
    onSelectDay(day);
    
    // MapContext를 통해 중앙화된 렌더링 프로세스 시작
    startDayRendering(day);
    
    // 일자 선택 이벤트 발생
    window.dispatchEvent(new CustomEvent('itineraryDaySelected', { 
      detail: { day, timestamp: Date.now() } 
    }));
    console.log(`[DaySelector] Dispatched 'itineraryDaySelected' event for day ${day}`);
    
  }, [onSelectDay, startDayRendering]);

  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md">
      <div className="flex gap-2 overflow-x-auto px-2 py-1 max-w-[calc(100vw-2rem)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {itinerary.map((dayItem) => (
          <Button
            key={dayItem.day}
            variant={selectedDay === dayItem.day ? "default" : "outline"}
            size="sm"
            className={`min-w-16 h-16 rounded-md flex flex-col items-center justify-center gap-0.5 px-3 ${
              selectedDay === dayItem.day ? 'bg-primary text-primary-foreground' : ''
            }`}
            onClick={() => handleDayClick(dayItem.day)}
          >
            <span className="font-bold text-sm">{dayItem.day}일차</span>
            <span className="text-xs">{`${dayItem.date || ''}(${dayItem.dayOfWeek || ''})`}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DaySelector;
