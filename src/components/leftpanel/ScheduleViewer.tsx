
import React, { useEffect } from 'react';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScheduleViewerProps {
  schedule?: ItineraryDay[];
  selectedDay?: number | null;
  onDaySelect?: (day: number) => void;
  onClose?: () => void;
  startDate?: Date;
  itineraryDay?: ItineraryDay | null;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  schedule,
  selectedDay,
  onDaySelect,
  onClose,
  startDate = new Date(),
  itineraryDay
}) => {
  useEffect(() => {
    console.log("ScheduleViewer 마운트/업데이트:", {
      scheduleLength: schedule?.length || 0,
      selectedDay,
      itineraryDayPresent: !!itineraryDay,
      startDate: startDate.toISOString()
    });
  }, [schedule, selectedDay, itineraryDay, startDate]);

  const formatTimeBlock = (timeBlock: string): string => {
    const parts = timeBlock.split('_');
    if (parts.length < 2) return timeBlock;
    
    const timePart = parts[1];
    // timeBlock에서 시간 추출 (예: "0900" -> "09:00")
    if (timePart.match(/^\d{4}$/)) {
      const hour = timePart.slice(0, 2);
      const minute = timePart.slice(2, 4);
      return `${hour}:${minute}`;
    }
    
    return timePart;
  };

  const categoryToKorean = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'accommodation': '숙소',
      'attraction': '관광지',
      'restaurant': '음식점',
      'cafe': '카페',
      'unknown': '기타'
    };
    return categoryMap[category.toLowerCase()] || category;
  };

  const currentDayToDisplay = itineraryDay || 
    (selectedDay !== null && schedule && schedule.length > 0 ? 
      schedule.find(d => d.day === selectedDay) : null);

  if (!currentDayToDisplay && selectedDay !== null) {
    console.warn(`ScheduleViewer: 선택된 날짜(${selectedDay})에 해당하는 일정 데이터가 없습니다.`);
  }
  
  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        {currentDayToDisplay ? (
          <div className="p-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>DAY {currentDayToDisplay.day} ({currentDayToDisplay.date}, {currentDayToDisplay.dayOfWeek})</span>
                  <div className="flex items-center text-sm text-muted-foreground">
                    총 거리: {currentDayToDisplay.totalDistance ? currentDayToDisplay.totalDistance.toFixed(1) : 'N/A'}km
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {currentDayToDisplay.places.length > 0 ? (
                    currentDayToDisplay.places.map((place, idx) => {
                      const uniquePlaceKey = `place-${place.numericDbId || place.id || place.name.replace(/\s+/g, '')}-${idx}-day${currentDayToDisplay.day}`;
                      
                      return (
                        <div key={uniquePlaceKey} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-primary">
                                {place.arriveTime || formatTimeBlock(place.timeBlock)}
                              </span>
                              {place.stayDuration && place.stayDuration > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({Math.floor(place.stayDuration / 60)}시간 {place.stayDuration % 60 > 0 ? `${place.stayDuration % 60}분` : ''} 체류)
                                </span>
                              )}
                            </div>
                            
                            <div className="font-medium">{place.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {categoryToKorean(place.category)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      이 날에는 일정이 없습니다
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
            {selectedDay ? `선택된 ${selectedDay}일차의 일정을 불러오는 중이거나 데이터가 없습니다.` : '표시할 일정이 없습니다. 날짜를 선택해주세요.'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ScheduleViewer;
