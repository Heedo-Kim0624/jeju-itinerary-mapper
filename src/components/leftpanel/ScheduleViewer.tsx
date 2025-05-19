import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Clock, Navigation } from 'lucide-react';

export interface ScheduleViewerProps {
  schedule: ItineraryDay[]; // Made non-optional as a schedule viewer should have a schedule
  selectedDay: number | null; // Kept as is
  onDaySelect?: (day: number) => void; // Made optional
  onClose?: () => void;
  startDate: Date; // Made non-optional
  itineraryDay?: ItineraryDay | null;
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  schedule,
  selectedDay,
  onDaySelect = () => {}, // Provided default empty function
  onClose,
  startDate,
  itineraryDay
}) => {
  useEffect(() => {
    console.log("ScheduleViewer 마운트/업데이트:", {
      scheduleLength: schedule?.length || 0,
      selectedDay,
      itineraryDayPresent: !!itineraryDay,
      startDate: startDate?.toISOString() // Added optional chaining for startDate
    });
  }, [schedule, selectedDay, itineraryDay, startDate]);

  const categoryToKorean = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'accommodation': '숙소',
      'attraction': '관광지',
      'restaurant': '음식점',
      'cafe': '카페'
    };
    
    return categoryMap[category] || category;
  };

  const currentDayToDisplay = itineraryDay || 
    (selectedDay !== null && schedule && schedule.length > 0 ? 
      schedule.find(d => d.day === selectedDay) : null);

  if (!currentDayToDisplay && selectedDay !== null) {
    console.warn(`ScheduleViewer: 선택된 날짜(${selectedDay})에 해당하는 일정 데이터가 없습니다.`, {
      scheduleAvailable: !!schedule,
      scheduleDays: schedule?.map(d => d.day)
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">일정 상세</h2>
        {onClose && <Button variant="ghost" size="sm" onClick={onClose}>닫기</Button>}
      </div>
      <ScrollArea className="flex-1">
        {currentDayToDisplay ? (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">{currentDayToDisplay.day}일차 일정</h3>
              <div className="text-sm text-muted-foreground mb-1">
                {currentDayToDisplay.date} ({currentDayToDisplay.dayOfWeek})
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                총 이동 거리: {currentDayToDisplay.totalDistance ? currentDayToDisplay.totalDistance.toFixed(2) : 'N/A'} km
              </div>
            </div>
            
            <div className="space-y-4 relative">
              {/* Timeline line */}
              {currentDayToDisplay.places.length > 1 && (
                <div className="absolute top-6 bottom-6 left-[23px] w-0.5 bg-gray-300 z-0"></div>
              )}
              
              {currentDayToDisplay.places.map((place, idx) => (
                <div key={place.id || `place-${idx}-${place.name}`} className="flex items-start relative z-10">
                  {/* Timeline circle */}
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full text-white font-bold flex items-center justify-center border-2 border-white shadow-md z-10 ${
                    idx === 0 ? 'bg-green-500' : idx === currentDayToDisplay.places.length -1 && currentDayToDisplay.places.length > 1 ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {idx + 1}
                  </div>
                  
                  <div className="ml-4 flex-1 border rounded-lg p-3 bg-white shadow">
                    <div className="font-semibold text-base">{place.name}</div>
                    <div className="text-sm text-gray-600">
                      {categoryToKorean(place.category || '기타')}
                    </div>
                    
                    {(place.arriveTime || place.departTime || place.stayDuration) && (
                       <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1.5 text-gray-400" />
                        {place.arriveTime && <span>도착: {place.arriveTime}</span>}
                        {place.departTime && <span className="ml-2">출발: {place.departTime}</span>}
                        {place.stayDuration && <span className="ml-2">체류: {place.stayDuration}분</span>}
                      </div>
                    )}
                    
                    {place.timeBlock && (!place.arriveTime && !place.departTime) && (
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1.5 text-gray-400" />
                        <span>시간대: {place.timeBlock}</span>
                      </div>
                    )}
                    
                    {place.travelTimeToNext && place.travelTimeToNext !== "-" && idx < currentDayToDisplay.places.length - 1 && (
                      <div className="flex items-center mt-1.5 text-xs text-gray-500">
                        <Navigation className="w-3 h-3 mr-1.5 text-gray-400" />
                        <span>다음 장소까지: {place.travelTimeToNext}</span>
                      </div>
                    )}
                    {place.address && <div className="text-xs text-gray-500 mt-1">{place.address}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
            {selectedDay ? `선택된 ${selectedDay}일차의 일정을 불러오는 중이거나 데이터가 없습니다.` : '일정을 보려면 좌측 패널에서 날짜를 선택해주세요.'}
          </div>
        )}
      </ScrollArea>
      {schedule && schedule.length > 0 && (
        <div className="p-2 border-t">
          <div className="grid grid-cols-3 gap-1">
            {schedule.map(d => (
              <Button
                key={d.day}
                variant={selectedDay === d.day ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDaySelect(d.day)}
                className="w-full text-xs"
              >
                {d.day}일차
                <br/>
                ({d.date})
              </Button>
            ))}
          </div>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && !currentDayToDisplay && selectedDay !== null && (
        <div className="p-4 bg-yellow-100 text-yellow-800 text-sm">
          디버깅 (ScheduleViewer): 선택된 날짜({selectedDay})에 해당하는 일정 데이터가 없습니다.<br />
          schedule prop: {schedule ? `${schedule.length}일 (${schedule.map(d=>d.day).join(',')})` : 'undefined'}<br />
          itineraryDay prop: {itineraryDay ? '제공됨' : '제공되지 않음'}
        </div>
      )}
    </div>
  );
};

export default ScheduleViewer;
