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
  onSelectDay: (day: ItineraryDay) => void; // ItineraryDay 객체 전체를 받도록 변경
  selectedDay: ItineraryDay | null; // ItineraryDay 객체 전체를 받도록 변경
  onClose?: () => void;
  debug?: {
    itineraryLength: number;
    selectedDayObject: ItineraryDay | null; // 이름 변경
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
      selectedDayObject: selectedDay, // 변경된 props 사용
      startDate: startDate?.toISOString(),
      debugInfo: debug
    });
    
    if (itinerary?.length > 0 && selectedDay === null && onSelectDay) {
      // Ensure itinerary[0] exists and day is valid before selecting
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        console.log("ItineraryView: 첫 번째 날짜 자동 선택:", itinerary[0]);
        onSelectDay(itinerary[0]); // ItineraryDay 객체 전달
      } else {
        console.warn("ItineraryView: 첫 번째 날짜 자동 선택 불가 - itinerary[0] 또는 day가 유효하지 않음");
      }
    }
  }, [itinerary, selectedDay, onSelectDay, startDate, debug]);

  const handleDayClick = (dayItem: ItineraryDay) => { // ItineraryDay 객체 받음
    console.log(`ItineraryView: 일자 선택: ${dayItem.day}일차`);
    onSelectDay(dayItem); // ItineraryDay 객체 전달
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
    <div className="w-full h-full flex flex-col bg-white">
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

      {/* 일정 날짜 버튼 - 가로 스크롤 */}
      <div className="flex overflow-x-auto whitespace-nowrap p-4 border-b scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {itinerary.map((dayItem) => (
          <Button
            key={dayItem.day}
            variant={selectedDay?.day === dayItem.day ? "default" : "outline"}
            className="mr-2 flex-shrink-0 flex flex-col h-auto py-2 px-3 leading-snug" // 버튼 스타일 조정
            onClick={() => handleDayClick(dayItem)}
          >
            <span className="font-bold text-sm">{dayItem.day}일차</span>
            <span className="text-xs opacity-70">
              {dayItem.date}({dayItem.dayOfWeek})
            </span>
          </Button>
        ))}
      </div>
      
      {/* 선택된 날짜의 일정 내용 - 세로 스크롤 */}
      {/* ScheduleViewer가 이 역할을 하도록 수정. ItineraryPanel과 유사하게 구성 */}
      <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 200px)' }}> {/* Adjust height as needed */}
        <div className="p-4">
          {selectedDay && (
            <ScheduleViewer
              schedule={itinerary} // 전체 일정 전달
              selectedDay={selectedDay.day} // 선택된 '일자 번호' 전달
              onDaySelect={(dayNum) => { // ScheduleViewer가 일자 번호로 콜백하면
                const newSelectedDay = itinerary.find(d => d.day === dayNum);
                if (newSelectedDay) onSelectDay(newSelectedDay);
              }}
              startDate={startDate}
              itineraryDay={selectedDay} // 선택된 ItineraryDay 객체 전달
            />
          )}
          {!selectedDay && itinerary.length > 0 && (
            <div className="text-center text-muted-foreground p-8">
              날짜를 선택하여 일정을 확인하세요.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
export default ItineraryView;
