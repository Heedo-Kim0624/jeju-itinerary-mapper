
import React, { useEffect } from 'react';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, MapPin, Navigation, Phone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner'; // Added toast import

interface ScheduleViewerProps {
  itinerary: ItineraryDay[]; // Changed from schedule to itinerary (already done in provided code, confirming)
  startDate: Date | null;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onClose?: () => void;
  itineraryDay?: ItineraryDay | null; 
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  itinerary, 
  startDate,
  selectedDay,
  onSelectDay,
  onClose,
  itineraryDay 
}) => {
  useEffect(() => {
    console.log("ScheduleViewer 마운트/업데이트:", {
      itineraryLength: itinerary?.length || 0,
      itineraryDayProvided: !!itineraryDay,
      startDate,
      selectedDay
    });

    if (!itineraryDay && itinerary?.length > 0 && selectedDay === null && itinerary[0]?.day) {
      console.log("ScheduleViewer: 첫 번째 일자 자동 선택 (via full itinerary):", itinerary[0].day);
      onSelectDay(itinerary[0].day);
    }
  }, [itinerary, selectedDay, onSelectDay, startDate, itineraryDay]);

  const currentDayToDisplay = itineraryDay || 
    (selectedDay !== null && itinerary && itinerary.length > 0 ? 
      itinerary.find(d => d.day === selectedDay) : null);
  
  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <p className="text-lg font-medium">일정 데이터가 없습니다</p>
        <p className="text-sm text-muted-foreground mt-2">장소를 선택하고 일정을 생성해주세요</p>
      </div>
    );
  }
  
  const formatDateForDayButton = (dayNum: number) => {
    if (!startDate) return "";
    const date = addDays(startDate, dayNum - 1);
    return format(date, 'MM/dd (EEE)', { locale: ko });
  };

  const getCategoryStyle = (category: string | undefined) => {
    if (category === 'accommodation') return { name: '숙소', color: 'bg-blue-500', textColor: 'bg-blue-100 text-blue-800' };
    if (category === 'touristSpot' || category === 'attraction') return { name: '관광지', color: 'bg-green-500', textColor: 'bg-green-100 text-green-800' };
    if (category === 'restaurant') return { name: '음식점', color: 'bg-red-500', textColor: 'bg-red-100 text-red-800' };
    if (category === 'cafe') return { name: '카페', color: 'bg-purple-500', textColor: 'bg-purple-100 text-purple-800' };
    return { name: category || '기타', color: 'bg-gray-500', textColor: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            {currentDayToDisplay ? `${currentDayToDisplay.day}일차 상세 일정` : "일정 상세"}
          </h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              닫기
            </Button>
          )}
        </div>

        {itinerary && itinerary.length > 1 && (
             <ScrollArea className="pb-2">
                <div className="flex gap-2">
                    {itinerary.map(dayItem => {
                    const formattedDate = formatDateForDayButton(dayItem.day);
                    return (
                        <Button
                        key={dayItem.day}
                        variant={selectedDay === dayItem.day ? "default" : "outline"}
                        className="flex flex-col h-auto py-2 px-3 min-w-[5rem] whitespace-nowrap"
                        onClick={() => onSelectDay(dayItem.day)}
                        >
                        <span className="font-semibold text-sm">{dayItem.day}일차</span>
                        <span className="text-xs">{formattedDate}</span>
                        </Button>
                    );
                    })}
                </div>
            </ScrollArea>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {currentDayToDisplay ? (
          <div className="p-4">
            <div className="mb-4">
              {startDate && (
                <h3 className="text-xl font-bold mb-1">
                  {currentDayToDisplay.day}일차 - {formatDateForDayButton(currentDayToDisplay.day)}
                </h3>
              )}
              <div className="text-sm text-muted-foreground">
                총 이동 거리: {currentDayToDisplay.totalDistance ? currentDayToDisplay.totalDistance.toFixed(1) : 'N/A'} km
              </div>
            </div>
            
            <div className="space-y-4 relative">
              {currentDayToDisplay.places.length > 1 && (
                 <div className="absolute top-5 bottom-5 left-[1.45rem] w-0.5 bg-gray-200 z-0"></div>
              )}
             
              {currentDayToDisplay.places.map((place, index) => {
                const categoryStyle = getCategoryStyle(place.category);
                const placeWithTime = place as ItineraryPlaceWithTime;

                return (
                  <div key={place.id || `place-${index}-${place.name}`} className="flex items-start relative z-10">
                    <div className={`mt-1 flex-shrink-0 w-12 h-12 rounded-full ${categoryStyle.color} text-white font-bold flex items-center justify-center border-2 border-white shadow-md`}>
                      {index + 1}
                    </div>
                    
                    <div className="ml-4 flex-1 border rounded-lg p-3 bg-white shadow">
                      <h4 className="font-semibold text-md">{place.name}</h4>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block my-1 ${categoryStyle.textColor}`}>
                        {categoryStyle.name}
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                        {place.address || place.road_address ? (
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            <span>{place.address || place.road_address}</span>
                          </div>
                        ) : null}

                        {placeWithTime.timeBlock && (
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            <span>도착/활동: {placeWithTime.timeBlock}</span>
                          </div>
                        )}
                        
                        {place.phone && (
                          <div className="flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            <span>{place.phone}</span>
                          </div>
                        )}

                        {placeWithTime.travelTimeToNext && placeWithTime.travelTimeToNext !== "-" && (
                          <div className="flex items-center mt-2 pt-2 border-t border-gray-100">
                            <Navigation className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-blue-500" />
                            <span className="text-blue-600">다음 장소까지: {placeWithTime.travelTimeToNext}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
            <Clock size={48} className="mb-4 text-gray-400" />
            <p className="text-lg">일정을 보려면 날짜를 선택해주세요.</p>
            {itinerary.length > 0 && !selectedDay && <p className="text-sm mt-1">위의 버튼에서 여행일을 선택할 수 있습니다.</p>}
          </div>
        )}
      </ScrollArea>
      
      {currentDayToDisplay && (
        <div className="p-3 bg-gray-50 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              console.log(`지도에 ${selectedDay}일차 경로 표시 요청 (ScheduleViewer)`);
              toast.info(`${selectedDay}일차 경로를 지도에 표시합니다. (구현 필요)`);
            }}
          >
            <MapPin className="w-4 h-4 mr-2" />
            지도에 {selectedDay}일차 경로 표시
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScheduleViewer;
