
import React from 'react';
import { Button } from '@/components/ui/button';
import { ItineraryDay } from '@/types';
import { useMapDaySelector } from '@/hooks/map/useMapDaySelector'; // Changed
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; // Added

interface DaySelectorProps {
  itinerary: ItineraryDay[] | null;
  // selectedDay and onSelectDay are now handled by useMapDaySelector
}

const DaySelector: React.FC<DaySelectorProps> = ({ itinerary }) => {
  const { selectedDayFromUI, handleDaySelect } = useMapDaySelector();
  const { getDayRouteData } = useRouteMemoryStore();

  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md">
      <div className="flex gap-2 overflow-x-auto px-2 py-1 max-w-[calc(100vw-2rem)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {itinerary.map((dayItem) => {
          const dayNum = dayItem.day;
          const dayData = getDayRouteData(dayNum);
          // Check if linkIds exist and has items.
          const hasRouteData = dayData && dayData.linkIds && dayData.linkIds.length > 0;

          return (
            <Button
              key={dayItem.day}
              variant={selectedDayFromUI === dayItem.day ? "default" : "outline"}
              size="sm"
              className={`min-w-20 h-16 rounded-md flex flex-col items-center justify-center gap-0.5 px-3 relative ${ // Increased min-w for indicator
                selectedDayFromUI === dayItem.day ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => handleDaySelect(dayItem.day)}
            >
              <span className="font-bold text-sm">{dayItem.day}일차</span>
              <span className="text-xs">{`${dayItem.date}(${dayItem.dayOfWeek})`}</span>
              {hasRouteData && (
                <span 
                  className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" 
                  title="경로 데이터 있음" 
                />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default DaySelector;
