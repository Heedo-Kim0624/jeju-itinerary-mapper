
import React from 'react';
import { Button } from '@/components/ui/button';
import { ItineraryDay as CoreItineraryDay } from '@/types/core'; 
import { useMapDaySelector } from '@/hooks/map/useMapDaySelector'; 
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; 
import { useItinerary } from '@/hooks/use-itinerary'; 

interface DaySelectorProps {
  itinerary: CoreItineraryDay[] | null;
}

const DaySelector: React.FC<DaySelectorProps> = ({ itinerary }) => {
  const { handleDaySelect } = useMapDaySelector();
  const { selectedDay: primarySelectedDay } = useItinerary(); 
  const { getDayRouteData } = useRouteMemoryStore();

  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md">
      <div className="flex gap-2 overflow-x-auto px-2 py-1 max-w-[calc(100vw-2rem)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {itinerary.map((dayItem) => {
          const dayNum = dayItem.day;
          const dayStoreData = getDayRouteData(dayNum);
          const hasRouteData = dayStoreData && dayStoreData.linkIds && dayStoreData.linkIds.length > 0;
          const hasRenderedPolylines = dayStoreData && dayStoreData.polylines && dayStoreData.polylines.length > 0;

          return (
            <Button
              key={dayItem.day}
              variant={primarySelectedDay === dayNum ? "default" : "outline"}
              size="sm"
              className={`min-w-[4.5rem] h-16 rounded-md flex flex-col items-center justify-center gap-0.5 px-3 relative ${
                primarySelectedDay === dayNum ? 'bg-primary text-primary-foreground' : ''
              }`}
              onClick={() => handleDaySelect(dayNum)} 
            >
              <span className="font-bold text-sm">{dayNum}일차</span>
              <span className="text-xs">{`${dayItem.date}(${dayItem.dayOfWeek})`}</span>
              {(hasRouteData || hasRenderedPolylines) && (
                <span 
                  className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white"
                  title="경로 데이터 또는 렌더링된 경로 있음"
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
