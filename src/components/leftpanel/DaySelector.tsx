
import React, { useCallback } from 'react'; // useCallback 추가
import { Button } from '@/components/ui/button';
import { ItineraryDay } from '@/types';
import { useMapContext } from '@/components/rightpanel/MapContext'; // useMapContext 추가

interface DaySelectorProps {
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  onSelectDay: (day: number) => void; // Prop 이름 onSelectDay로 유지 (기존 사용처와 일관성)
}

const DaySelector: React.FC<DaySelectorProps> = ({
  itinerary,
  selectedDay,
  onSelectDay,
}) => {
  const { startDayRendering, clearAllRoutes, clearMarkersAndUiElements } = useMapContext(); // MapContext에서 필요한 함수들 가져오기

  const handleDayClick = useCallback((day: number) => { // 함수 이름 변경 및 useCallback 사용
    console.log(`[DaySelector] Day ${day} selected by user.`);
    
    // 1. 지도 요소들 초기화 (경로와 마커)
    if (clearAllRoutes) clearAllRoutes();
    if (clearMarkersAndUiElements) clearMarkersAndUiElements();
    
    // 2. 상위 컴포넌트에 일자 변경 알림 (예: App State 업데이트)
    onSelectDay(day); 
    
    // 3. MapContext를 통해 중앙화된 렌더링 프로세스 시작
    if (startDayRendering) {
      startDayRendering(day);
      console.log(`[DaySelector] Called startDayRendering for day ${day}`);
    }

    // 4. 명시적으로 itineraryDaySelected 이벤트 발생시켜 다른 컴포넌트들에게 알림
    const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
      detail: { day, timestamp: Date.now() } 
    });
    window.dispatchEvent(daySelectedEvent);
    console.log(`[DaySelector] Dispatched 'itineraryDaySelected' event for day ${day}`);

  }, [onSelectDay, startDayRendering, clearAllRoutes, clearMarkersAndUiElements]);

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
            onClick={() => handleDayClick(dayItem.day)} // 변경된 핸들러 사용
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
