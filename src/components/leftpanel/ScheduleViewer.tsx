
import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ItineraryDay } from '@/hooks/use-itinerary-creator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface ScheduleViewerProps {
  schedule?: ItineraryDay[];
  selectedDay?: number | null;
  onDaySelect?: (day: number) => void;
  onClose?: () => void;
  startDate?: Date;
  itineraryDay?: ItineraryDay;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  schedule,
  selectedDay,
  onDaySelect,
  onClose,
  startDate = new Date(),
  itineraryDay
}) => {
  const categoryToKorean = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'accommodation': '숙소',
      'attraction': '관광지',
      'restaurant': '음식점',
      'cafe': '카페'
    };
    
    return categoryMap[category] || category;
  };

  // If itineraryDay is provided, use it instead of finding one from schedule
  const currentDay = itineraryDay || (selectedDay !== null && schedule ? 
    schedule.find(d => d.day === selectedDay) : null);

  return (
    <div className="h-full flex flex-col">
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

      {schedule && onDaySelect && (
        <div className="flex overflow-x-auto p-2 border-b">
          {schedule.map((day) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + day.day - 1);
            const formattedDate = format(dayDate, 'MM/dd(eee)', { locale: ko });
            
            return (
              <Button
                key={day.day}
                variant={selectedDay === day.day ? "default" : "outline"}
                className="mx-1 whitespace-nowrap"
                onClick={() => onDaySelect(day.day)}
              >
                {day.day}일차 ({formattedDate})
              </Button>
            );
          })}
        </div>
      )}

      <ScrollArea className="flex-1">
        {currentDay ? (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">{currentDay.day}일차 일정</h3>
              <div className="text-sm text-muted-foreground mb-4">
                총 이동 거리: {currentDay.totalDistance.toFixed(2)} km
              </div>
            </div>
            
            <div className="space-y-4">
              {currentDay.places.map((place, idx) => (
                <div key={place.id} className="flex border rounded-lg overflow-hidden bg-white">
                  <div className="h-full bg-primary-100 flex items-center justify-center w-12 font-bold text-lg border-r">
                    {idx + 1}
                  </div>
                  <div className="p-3 flex-1">
                    <div className="font-medium">{place.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {categoryToKorean(place.category)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            일자를 선택해주세요
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ScheduleViewer;
