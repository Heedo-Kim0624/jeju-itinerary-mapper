
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { ItineraryDay } from '@/types';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';

interface ScheduleViewerProps {
  schedule: ItineraryDay[];
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
  startDate,
}) => {
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
    
    // 기타 형태는 그대로 반환
    return timePart;
  };

  const formatTimeRange = (timeBlock: string, stayDuration?: number): string => {
    const startTime = formatTimeBlock(timeBlock);
    
    if (!stayDuration || stayDuration <= 0) {
      return startTime;
    }

    // 시작 시간을 분 단위로 변환
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    
    // 체류 시간을 더해서 종료 시간 계산
    const endTotalMinutes = startTotalMinutes + stayDuration;
    const endHour = Math.floor(endTotalMinutes / 60) % 24;
    const endMinute = endTotalMinutes % 60;
    
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    return `${startTime} ~ ${endTime}`;
  };

  const getCategoryStyle = (category: string) => {
    const categoryKey = category.toLowerCase();
    const colors = categoryColors[categoryKey];
    
    if (colors) {
      return {
        backgroundColor: colors.marker,
        color: 'white'
      };
    }
    
    return {
      backgroundColor: '#6B7280',
      color: 'white'
    };
  };

  if (!schedule || schedule.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>생성된 일정이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 날짜 선택 버튼들 */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {schedule.map((day) => {
          const distance = day.totalDistance || 0;
          
          return (
            <button
              key={day.day}
              onClick={() => onDaySelect?.(day.day)}
              className={`min-w-20 h-20 rounded-md flex flex-col items-center justify-center gap-0.5 px-3 border transition-colors ${
                selectedDay === day.day 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <span className="font-bold text-sm">{day.day}일차</span>
              <span className="text-xs">{day.date}({day.dayOfWeek})</span>
              <span className="text-xs text-muted-foreground">
                {distance.toFixed(1)}km
              </span>
            </button>
          );
        })}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {schedule.map((day) => (
            <Card key={day.day} className={selectedDay === day.day ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>DAY {day.day} ({day.date}, {day.dayOfWeek})</span>
                  <div className="flex items-center text-sm text-muted-foreground">
                    총 거리: {typeof day.totalDistance === 'number' ? `${day.totalDistance.toFixed(1)}km` : '정보 없음'}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {day.places.length > 0 ? (
                    day.places.map((place, index) => {
                      const categoryStyle = getCategoryStyle(place.category);
                      
                      return (
                        <div key={`${place.id}-${index}`} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: categoryStyle.backgroundColor }}>
                          <div 
                            className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0"
                            style={categoryStyle}
                          >
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-primary">
                                {formatTimeRange(place.timeBlock, place.stayDuration)}
                              </span>
                              <Badge 
                                className="text-xs" 
                                style={categoryStyle}
                              >
                                {getCategoryName(place.category)}
                              </Badge>
                            </div>
                            
                            <div className="font-medium text-lg">{place.name}</div>
                            
                            {place.stayDuration && place.stayDuration > 0 && (
                              <div className="text-sm text-muted-foreground mt-1">
                                체류시간: {Math.floor(place.stayDuration / 60)}시간 {place.stayDuration % 60 > 0 ? `${place.stayDuration % 60}분` : ''}
                              </div>
                            )}
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ScheduleViewer;
