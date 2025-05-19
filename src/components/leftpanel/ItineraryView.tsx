import React, { useEffect } from 'react';
import { Calendar, Clock, MapPin, Navigation } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';
import type { ItineraryDay, ItineraryPlaceWithTime } from '@/types'; // @/types에서 가져오도록 변경
import ScheduleViewer from './ScheduleViewer';

interface ItineraryViewProps {
  itinerary: ItineraryDay[];
  startDate: Date;
  onSelectDay: (day: number) => void;
  selectedDay: number | null;
  onClose?: () => void;
  debug?: {
    itineraryLength: number;
    selectedDay: number | null;
    showItinerary: boolean;
  };
}

const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  startDate,
  onSelectDay,
  selectedDay,
  onClose, 
  debug 
}) => {
  useEffect(() => {
    console.log("ItineraryView 마운트/업데이트:", {
      itineraryLength: itinerary?.length || 0,
      selectedDay,
      startDate: startDate?.toISOString(),
      debugInfo: debug
    });
    
    if (itinerary?.length > 0 && selectedDay === null && onSelectDay) {
      // Ensure itinerary[0] exists and day is valid before selecting
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        console.log("ItineraryView: 첫 번째 날짜 자동 선택:", itinerary[0].day);
        onSelectDay(itinerary[0].day);
      } else {
        console.warn("ItineraryView: 첫 번째 날짜 자동 선택 불가 - itinerary[0] 또는 day가 유효하지 않음");
      }
    }
  }, [itinerary, selectedDay, onSelectDay, startDate, debug]);

  const handleDayClick = (day: number) => {
    console.log(`ItineraryView: 일자 선택: ${day}일차`);
    onSelectDay(day);
  };

  // getDateForDay and getDayOfWeek are not used directly in JSX anymore
  // const getDateForDay = (day: number) => { ... };
  // const getDayOfWeek = (day: number) => { ... };

  if (!itinerary || itinerary.length === 0) {
    console.warn("ItineraryView: 일정 데이터가 없습니다.");
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>일정이 생성되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">생성된 여행 일정</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 뒤로
          </button>
        )}
      </div>
      
      <div className="flex overflow-x-auto pb-2 p-4 gap-2 border-b">
        {itinerary.map((dayItem) => {
          // dayItem.date 와 dayItem.dayOfWeek 를 직접 사용 (core.ts의 ItineraryDay에 포함됨)
          // const dayDate = new Date(startDate);
          // dayDate.setDate(startDate.getDate() + dayItem.day - 1);
          // const formattedDate = format(dayDate, 'MM/dd(EEE)', { locale: ko });
          const formattedDate = `${dayItem.date}(${dayItem.dayOfWeek})`;


          return (
            <Button
              key={dayItem.day}
              variant={selectedDay === dayItem.day ? "default" : "outline"}
              className="flex flex-col h-16 min-w-16 whitespace-nowrap"
              onClick={() => handleDayClick(dayItem.day)}
            >
              <span className="font-bold text-sm">{dayItem.day}일차</span>
              <span className="text-xs">{formattedDate}</span>
            </Button>
          );
        })}
      </div>
      
      <ScheduleViewer
        schedule={itinerary} 
        selectedDay={selectedDay}
        onDaySelect={onSelectDay} 
        startDate={startDate}
        itineraryDay={selectedDay !== null ? itinerary.find(d => d.day === selectedDay) : null}
      />
    </div>
  );
};
export default ItineraryView;
