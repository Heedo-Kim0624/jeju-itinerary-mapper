
import React from 'react';
import { Button } from '@/components/ui/button';
import { ItineraryDay } from '@/types'; // @/types에서 가져오도록 변경

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
            onClick={() => onSelectDay(dayItem.day)}
          >
            <span className="font-bold text-sm">{dayItem.day}일차</span>
            <span className="text-xs">{`${dayItem.date}(${dayItem.dayOfWeek})`}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DaySelector;
