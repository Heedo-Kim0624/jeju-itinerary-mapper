
import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Navigation } from 'lucide-react';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getCategoryName, mapCategoryNameToKey, getCategoryColor } from '@/utils/categoryColors';

interface ScheduleViewerProps {
  schedule: ItineraryDay[];
  selectedDay: number | null;
  onDaySelect: (day: number) => void;
  startDate: Date;
  itineraryDay?: ItineraryDay | null;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({ 
  schedule, 
  selectedDay, 
  onDaySelect, 
  startDate, 
  itineraryDay 
}) => {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">생성된 일정이 없습니다.</p>
      </div>
    );
  }

  // Use the specific day data if available
  const dayToDisplay = itineraryDay || 
    (selectedDay !== null ? schedule.find(d => d.day === selectedDay) : null) ||
    schedule[0];

  if (!dayToDisplay) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">선택된 날짜의 일정이 없습니다.</p>
      </div>
    );
  }

  // Get unique places by ID for the selected day
  const uniquePlaces: ItineraryPlaceWithTime[] = [];
  const seenPlaceIds = new Set<string>();
  
  dayToDisplay.places.forEach(place => {
    if (!seenPlaceIds.has(place.id)) {
      seenPlaceIds.add(place.id);
      uniquePlaces.push(place);
    }
  });

  const dayDate = new Date(startDate);
  dayDate.setDate(startDate.getDate() + dayToDisplay.day - 1);
  const formattedDate = format(dayDate, 'yyyy-MM-dd');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium tracking-tight">{dayToDisplay.day}일차 ({dayToDisplay.dayOfWeek}) - {formattedDate}</h3>
        <div className="flex items-center text-sm text-muted-foreground">
          <Navigation className="mr-1 h-4 w-4" />
          <span>총 이동 거리: {dayToDisplay.totalDistance?.toFixed(2) || '0'} km</span>
        </div>
      </div>

      <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
        <div className="space-y-4">
          {uniquePlaces.map((place, index) => {
            const categoryKey = mapCategoryNameToKey(place.category);
            const categoryColor = getCategoryColor(categoryKey);
            
            return (
              <div key={`${place.id}-${index}`} className="relative pl-8 border-l border-muted pb-6 last:pb-0">
                <div className="absolute top-0 left-[-16px] bg-background rounded-full border border-muted flex items-center justify-center h-8 w-8 text-primary font-bold">
                  {index + 1}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-base">{place.name}</h4>
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: categoryColor,
                        color: categoryColor
                      }}
                    >
                      {place.category || '기타'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {place.address && (
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        <span>{place.address}</span>
                      </div>
                    )}
                    
                    {place.arriveTime && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>방문 예정: {place.arriveTime}</span>
                      </div>
                    )}
                    
                    {place.stayDuration && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>머무는 시간: {place.stayDuration}분</span>
                      </div>
                    )}
                  </div>
                  
                  {place.travelTimeToNext && index < uniquePlaces.length - 1 && (
                    <div className="text-xs text-muted-foreground mt-2 border-t border-dashed border-muted pt-2">
                      <div className="flex items-center">
                        <Navigation className="mr-1 h-3 w-3" />
                        <span>다음 장소까지: {place.travelTimeToNext}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ScheduleViewer;
