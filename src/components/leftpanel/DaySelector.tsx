
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
  const { startDayRendering } = useMapContext(); // MapContext에서 startDayRendering 가져오기

  const handleDayClick = useCallback((day: number) => { // 함수 이름 변경 및 useCallback 사용
    console.log(`[DaySelector] Day ${day} selected by user.`);
    
    // 1. 상위 컴포넌트에 일자 변경 알림 (예: App State 업데이트)
    onSelectDay(day); 
    
    // 2. MapContext를 통해 중앙화된 렌더링 프로세스 시작
    // 이 호출은 MapContext 내부에서 상태를 설정하고, 필요한 클리어 작업 및
    // 'dayRenderingStarted' 이벤트를 발생시킴.
    startDayRendering(day);

    // 'itineraryDaySelected' 이벤트 직접 발생시키는 로직은 MapContext 내부나
    // App 레벨 상태 변경에 따른 useEffect에서 처리하는 것이 더 적절할 수 있음.
    // 현재는 startDayRendering이 그 역할을 일부 대신함.
    // 필요하다면, onSelectDay 이후 App 레ikulum에서 이벤트를 발생시킬 수 있음.
    // window.dispatchEvent(new CustomEvent('itineraryDaySelected', { detail: { day, timestamp: Date.now() } }));
    // console.log(`[DaySelector] Dispatched 'itineraryDaySelected' event for day ${day}`);

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
