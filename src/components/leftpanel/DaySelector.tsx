import React from 'react';
import { Button } from '@/components/ui/button';
import { useItineraryMapContext } from '@/contexts/ItineraryMapContext';
import { ItineraryDay } from '@/types/core';

// props 타입 정의 추가
interface DaySelectorProps {
  itinerary?: ItineraryDay[];
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
}

const DaySelector: React.FC<DaySelectorProps> = (props) => {
  // context 사용과 props 사용을 병행
  const contextValues = useItineraryMapContext();
  
  // props가 전달되면 props 우선, 아니면 context 사용
  const itinerary = props.itinerary || contextValues.itinerary;
  const selectedDay = props.selectedDay !== undefined ? props.selectedDay : contextValues.selectedDay;
  const selectDay = props.onSelectDay || contextValues.selectDay;
  
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
            onClick={() => selectDay(dayItem.day)}
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
