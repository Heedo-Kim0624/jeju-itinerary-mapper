
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
  startDate: Date; // This is the overall trip start date
  onSelectDay: (dayNumber: number) => void; // Expects day number
  selectedDay: number | null; // Currently selected day number
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
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        console.log("ItineraryView: 첫 번째 날짜 자동 선택:", itinerary[0].day);
        onSelectDay(itinerary[0].day);
      } else {
        console.warn("ItineraryView: 첫 번째 날짜 자동 선택 불가 - itinerary[0] 또는 day가 유효하지 않음");
      }
    }
  }, [itinerary, selectedDay, onSelectDay, startDate, debug]);

  const handleDayClick = (dayNumber: number) => {
    console.log(`ItineraryView: 일자 선택: ${dayNumber}일차`);
    onSelectDay(dayNumber);
  };

  if (!itinerary || itinerary.length === 0) {
    console.warn("ItineraryView: 일정 데이터가 없습니다.");
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Calendar size={48} className="text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">생성된 일정이 없습니다.</p>
        <p className="text-sm text-muted-foreground mt-1">다른 조건으로 다시 시도해보세요.</p>
        {/* onClose 버튼을 사용하는 뒤로가기 버튼이 있었으나, ItineraryDisplayWrapper의 뒤로가기 버튼으로 통일하기 위해 삭제 */}
      </div>
    );
  }
  
  const selectedDayData = selectedDay !== null ? itinerary.find(d => d.day === selectedDay) : null;

  return (
    <div className="w-full h-full flex flex-col bg-card text-card-foreground">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold tracking-tight">생성된 여행 일정</h2>
        {/* 
          기존에 여기에 있던 "← 뒤로" 버튼을 제거합니다.
          ItineraryDisplayWrapper 컴포넌트에 있는 "뒤로" 버튼으로 기능을 일원화합니다.
        */}
      </div>
      
      <div className="p-4 border-b">
        <div className="flex overflow-x-auto whitespace-nowrap pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent scrollbar-thumb-rounded-full">
          {itinerary.map((dayItem) => {
            // dayItem.date and dayItem.dayOfWeek should be directly available from ItineraryDay type
            const formattedDate = `${dayItem.date} (${dayItem.dayOfWeek})`;
            return (
              <Button
                key={dayItem.day}
                variant={selectedDay === dayItem.day ? "default" : "outline"}
                className="flex flex-col h-16 min-w-[4.5rem] mr-2 flex-shrink-0 px-3 py-2 text-left"
                onClick={() => handleDayClick(dayItem.day)}
              >
                <span className="font-bold text-sm">{dayItem.day}일차</span>
                <span className="text-xs text-muted-foreground">{formattedDate}</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Max height for scrollable area: full viewport height - approx height of header, day buttons, and some padding */}
      {/* Adjust calc(100vh - YYYpx) based on actual surrounding layout if ItineraryView is not full screen itself */}
      <ScrollArea className="flex-grow h-[calc(100%-160px)]"> {/* Approximate height, adjust as needed */}
        <div className="p-4">
          <ScheduleViewer
            schedule={itinerary} 
            selectedDay={selectedDay} // Pass the number
            onDaySelect={onSelectDay} // Pass the handler
            startDate={startDate} // Pass trip start date
            itineraryDay={selectedDayData} // Pass the data for the selected day
          />
        </div>
      </ScrollArea>
    </div>
  );
};
export default ItineraryView;
