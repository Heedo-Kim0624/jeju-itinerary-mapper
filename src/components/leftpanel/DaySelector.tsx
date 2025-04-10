
import React from 'react';
import { Button } from '@/components/ui/button';
import { ItineraryDay } from '@/types/supabase';

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
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md">
      {itinerary.map((day) => (
        <Button
          key={day.day}
          variant={selectedDay === day.day ? "default" : "outline"}
          size="sm"
          className="min-w-10 h-10 rounded-full"
          onClick={() => onSelectDay(day.day)}
        >
          {day.day}
        </Button>
      ))}
    </div>
  );
};

export default DaySelector;
