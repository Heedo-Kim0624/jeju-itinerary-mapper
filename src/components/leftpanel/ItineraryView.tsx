
import React from 'react';
import { Calendar, Clock, MapPin, Navigation, Tag } from 'lucide-react'; // Added Tag for category
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
      <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
        <p>생성된 일정이 없습니다. <br/>날짜와 장소를 선택 후 일정을 생성해주세요.</p>
      </div>
    );
  }

  console.log("ItineraryView 렌더링", {
    일수: itinerary.length,
    선택일자: selectedDay
  });

  const currentDayItinerary = selectedDay ? itinerary.find(day => day.day === selectedDay) : null;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <h2 className="text-lg font-semibold p-4 border-b bg-white">생성된 여행 일정</h2>
      
      <div className="flex overflow-x-auto pb-2 p-4 gap-2 border-b bg-white shadow-sm">
        {itinerary.map((day) => {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + day.day - 1);
          const formattedDate = format(dayDate, 'MM/dd(EEE)', { locale: ko });
          
          return (
            <Button
              key={day.day}
              variant={selectedDay === day.day ? "default" : "outline"}
              className={`flex flex-col h-16 min-w-[70px] whitespace-nowrap p-2 ${selectedDay === day.day ? 'shadow-md' : 'hover:shadow-sm'}`}
              onClick={() => handleDayClick(day.day)}
            >
              <span className="font-bold text-sm">{day.day}일차</span>
              <span className="text-xs">{formattedDate}</span>
            </Button>
          );
        })}
      </div>
      
      {currentDayItinerary ? (
        currentDayItinerary.places.length > 0 ? (
          <div className="flex-1 p-4">
            <div className="mb-4 p-3 bg-white rounded-lg shadow">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>{getDateForDay(currentDayItinerary.day)} ({getDayOfWeek(currentDayItinerary.day)})</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>총 이동거리: {currentDayItinerary.totalDistance?.toFixed(1) || '계산 중...'} km</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded-md">
                <Navigation className="h-4 w-4" />
                <span>지도에 {selectedDay}일차 경로가 표시됩니다.</span>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100%-150px)] pr-2"> {/* Adjusted height and added padding for scrollbar */}
              <div className="space-y-4 relative">
                {/* Timeline vertical line */}
                {currentDayItinerary.places.length > 1 && (
                    <div className="absolute top-6 bottom-6 left-[23px] w-0.5 bg-gray-300 z-0"></div>
                )}
                
                {currentDayItinerary.places.map((place, index) => (
                  <div 
                    key={`${place.id}-${index}`} // Use a more unique key if IDs can repeat in a day (should not happen ideally)
                    className="relative z-10 flex items-start" 
                  >
                    {/* Time block and marker */}
                    <div className="flex flex-col items-center mr-4">
                      {place.time_block && (
                        <div className="text-xs font-medium text-gray-700 mb-1 whitespace-nowrap">
                          {place.time_block}
                        </div>
                      )}
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white z-10 border-2 border-white shadow-md" 
                        style={{ backgroundColor: categoryColors[place.category]?.marker || '#718096' /* gray as default */ }}
                      >
                        {index + 1}
                      </div>
                    </div>
                    
                    {/* Place details card */}
                    <div 
                      className="flex-1 bg-white rounded-lg p-3 border shadow-sm animate-in fade-in-0 slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <h3 className="font-semibold text-gray-800">{place.name}</h3>
                      
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <Tag className="h-3 w-3" />
                        <span 
                          className={`px-1.5 py-0.5 rounded-full text-xs ${categoryColors[place.category]?.bg || 'bg-gray-100'} ${categoryColors[place.category]?.text || 'text-gray-800'}`}
                        >
                          {getCategoryName(place.category)}
                        </span>
                      </div>

                      {place.address && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{place.address}</span>
                        </div>
                      )}
                      
                      {place.arriveTime && place.time_block !== place.arriveTime && ( // Show arriveTime if different from time_block
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                          <Clock className="h-3 w-3" />
                          <span>도착 예상: {place.arriveTime}</span>
                        </div>
                      )}
                      
                      {index < currentDayItinerary.places.length - 1 && place.travelTimeToNext && place.travelTimeToNext !== "-" && (
                        <div className="flex items-center text-xs text-blue-600 mt-1 gap-1">
                          <Navigation className="h-3 w-3" />
                          <span>다음 장소까지: {place.travelTimeToNext}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
            <p>{selectedDay}일차에 예정된 장소가 없습니다.</p>
          </div>
        )
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
          <p>위에서 날짜를 선택하여 일정을 확인하세요.</p>
        </div>
      )}
    </div>
  );
};

export default ItineraryView;
