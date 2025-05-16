
import React from 'react';
import { Calendar, Clock, MapPin, Navigation } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { categoryColors, getCategoryName } from '@/utils/categoryColors';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';

interface ItineraryViewProps {
  itinerary: ItineraryDay[];
  startDate: Date;
  onSelectDay: (day: number) => void;
  selectedDay: number | null;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  startDate,
  onSelectDay,
  selectedDay,
}) => {
  const handleDayClick = (day: number) => {
    console.log(`일자 선택: ${day}일차`);
    onSelectDay(day);
  };

  const getDateForDay = (day: number) => {
    const date = addDays(new Date(startDate), day - 1);
    return format(date, 'yyyy년 MM월 dd일');
  };

  const getDayOfWeek = (day: number) => {
    const date = addDays(new Date(startDate), day - 1);
    return format(date, 'EEEE', { locale: ko });
  };

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>일정이 생성되지 않았습니다.</p>
      </div>
    );
  }

  console.log("ItineraryView 렌더링", {
    일수: itinerary.length,
    선택일자: selectedDay
  });

  const currentDayItinerary = selectedDay ? itinerary.find(day => day.day === selectedDay) : null;

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-lg font-semibold p-4 border-b">생성된 여행 일정</h2>
      
      <div className="flex overflow-x-auto pb-2 p-4 gap-2 border-b">
        {itinerary.map((day) => {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + day.day - 1);
          const formattedDate = format(dayDate, 'MM/dd(EEE)', { locale: ko });
          
          return (
            <Button
              key={day.day}
              variant={selectedDay === day.day ? "default" : "outline"}
              className="flex flex-col h-16 min-w-16 whitespace-nowrap"
              onClick={() => handleDayClick(day.day)}
            >
              <span className="font-bold text-sm">{day.day}일차</span>
              <span className="text-xs">{formattedDate}</span>
            </Button>
          );
        })}
      </div>
      
      {currentDayItinerary ? (
        <div className="flex-1 p-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{getDateForDay(currentDayItinerary.day)} ({getDayOfWeek(currentDayItinerary.day)})</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>총 이동거리: {currentDayItinerary.totalDistance?.toFixed(1) || '계산 중...'} km</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary mt-2 bg-primary/10 p-2 rounded-md">
              <Navigation className="h-4 w-4" />
              <span>지도에 {selectedDay}일차 경로가 표시됩니다</span>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="space-y-4 relative">
              <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-200 z-0"></div>
              
              {currentDayItinerary.places.map((place, index) => (
                <div 
                  key={place.id} 
                  className="relative z-10 ml-16 bg-white rounded-lg p-3 border shadow-sm animate-in fade-in-0 slide-in-from-bottom-1" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div 
                    className="absolute left-[-32px] w-12 h-12 rounded-full flex items-center justify-center font-bold text-white z-10" 
                    style={{ backgroundColor: categoryColors[place.category]?.marker || '#1F1F1F' }}
                  >
                    {index + 1}
                  </div>
                  
                  <div className="pl-3">
                    <h3 className="font-medium">{place.name}</h3>
                    
                    <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{place.address || '주소 정보 없음'}</span>
                    </div>
                    
                    {/* 도착 시간 표시 */}
                    {(place as ItineraryPlaceWithTime).arriveTime && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <Clock className="h-3 w-3" />
                        <span>도착: {(place as ItineraryPlaceWithTime).arriveTime}</span>
                      </div>
                    )}
                    
                    {/* 다음 장소까지 이동 시간 및 거리 */}
                    {index < currentDayItinerary.places.length - 1 && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <Navigation className="h-3 w-3" />
                        {(place as ItineraryPlaceWithTime).travelTimeToNext && (place as ItineraryPlaceWithTime).travelTimeToNext !== "-" ? (
                          <span>다음 장소까지: {(place as ItineraryPlaceWithTime).travelTimeToNext}</span>
                        ) : (
                          <span>다음 장소로 이동</span>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <span 
                        className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[place.category]?.bg || 'bg-gray-100'} ${categoryColors[place.category]?.text || 'text-gray-800'}`}
                      >
                        {getCategoryName(place.category)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">일차를 선택해주세요</p>
        </div>
      )}
    </div>
  );
};

export default ItineraryView;
