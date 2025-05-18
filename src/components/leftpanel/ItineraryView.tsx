
import React from 'react';
import { useItinerary } from '@/hooks/use-itinerary';
import type { ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase'; // Ensure types are imported
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Utensils, Coffee, BedDouble, Plane, ArrowRight } from 'lucide-react'; // Added more icons

// 일정 시각화 컴포넌트
const ItineraryView: React.FC<{ onClose?: () => void; startDate?: Date; debug?: any }> = ({ onClose }) => { // Added onClose from original, startDate and debug are not used by new logic but kept for interface consistency if needed by parent
  const { itinerary, selectedItineraryDay, handleSelectItineraryDay } = useItinerary();

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
        <Calendar size={48} className="mb-4" />
        <p>생성된 일정이 없습니다.</p>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4">
            뒤로가기
          </Button>
        )}
      </div>
    );
  }

  // 선택된 일자의 일정 데이터 (selectedItineraryDay가 null일 경우 첫 번째 날짜를 기본값으로)
  const currentDayData = itinerary.find(day => day.day === selectedItineraryDay) || itinerary[0];
  const actualSelectedDayNumber = currentDayData.day;


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '숙소': return <BedDouble className="w-5 h-5 mr-2 text-blue-500" />;
      case '관광지': return <MapPin className="w-5 h-5 mr-2 text-green-500" />;
      case '음식점': return <Utensils className="w-5 h-5 mr-2 text-orange-500" />;
      case '카페': return <Coffee className="w-5 h-5 mr-2 text-purple-500" />;
      case '공항': return <Plane className="w-5 h-5 mr-2 text-gray-500" />;
      default: return <MapPin className="w-5 h-5 mr-2 text-gray-400" />;
    }
  };
  
  const getCategoryColors = (category: string): {bgColor: string, textColor: string, borderColor: string} => {
     switch (category) {
      case '숙소': return { bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' };
      case '관광지': return { bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' };
      case '음식점': return { bgColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' };
      case '카페': return { bgColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300' };
      case '공항': return { bgColor: 'bg-gray-200', textColor: 'text-gray-700', borderColor: 'border-gray-400'};
      default: return { bgColor: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-300' };
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">생성된 여행 일정</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ← 뒤로
          </Button>
        )}
      </div>
      
      {/* 일자 선택 탭 */}
      <div className="flex overflow-x-auto p-2 gap-2 border-b bg-gray-50">
        {itinerary.map((dayItem: ItineraryDay) => (
          <Button
            key={dayItem.day}
            variant={dayItem.day === actualSelectedDayNumber ? "default" : "outline"}
            className="flex flex-col h-auto px-3 py-2 min-w-[90px] whitespace-nowrap"
            onClick={() => handleSelectItineraryDay(dayItem.day)}
          >
            <span className="font-bold text-sm">{dayItem.day}일차</span>
            <span className="text-xs text-muted-foreground">{dayItem.date} ({dayItem.dayOfWeek?.substring(0,1)})</span>
          </Button>
        ))}
      </div>

      {/* 선택된 일자 요약 정보 */}
      {currentDayData && (
        <div className="p-4 bg-gray-100 border-b">
          <h3 className="text-md font-semibold">{actualSelectedDayNumber}일차: {currentDayData.date} ({currentDayData.dayOfWeek})</h3>
          <div className="text-sm text-muted-foreground mt-1">
            총 이동 거리: {currentDayData.totalDistance ? currentDayData.totalDistance.toFixed(1) : '0.0'} km
          </div>
        </div>
      )}

      {/* 일정 목록 */}
      <ScrollArea className="flex-1">
        {currentDayData && currentDayData.places && currentDayData.places.length > 0 ? (
          <div className="p-4 space-y-3">
            {currentDayData.places.map((place, index) => {
              const {bgColor, textColor, borderColor} = getCategoryColors(place.category);
              return (
                <div key={place.id || index} className="relative">
                  {/* 연결선 */}
                  {index < currentDayData.places.length - 1 && (
                    <div className="absolute left-5 top-10 h-[calc(100%-20px)] w-0.5 bg-gray-300 -translate-x-1/2 z-0" />
                  )}
                  
                  <div className="flex items-start relative z-10">
                    {/* 번호 원 */}
                    <div 
                        className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} ${textColor.replace('text-', 'text-')} flex items-center justify-center font-bold text-base border-2 border-white shadow-md`}
                        style={{borderColor: getCategoryColors(place.category).borderColor.replace('border-', '#')}} // Directly apply border color
                    >
                      {index + 1}
                    </div>
                    
                    {/* 장소 정보 */}
                    <div className={`ml-3 flex-1 ${bgColor} p-3 rounded-lg border ${borderColor} shadow-sm`}>
                        <div className="flex items-center">
                          {getCategoryIcon(place.category)}
                          <h4 className={`font-semibold ${textColor}`}>{place.name}</h4>
                        </div>
                        
                        <div className={`mt-1.5 text-xs ${textColor} space-y-0.5`}>
                          {place.address && (
                            <p>주소: {place.address || place.road_address}</p>
                          )}
                          {place.timeBlock && (
                            <p>시간: {place.timeBlock.split('_')[1] || ''}:00 예정</p>
                          )}
                        </div>
                    </div>
                  </div>
                  {/* 다음 장소 이동 정보 */}
                  {place.distanceToNext && place.distanceToNext > 0 && index < currentDayData.places.length -1 && (
                    <div className="ml-5 pl-10 py-2 flex items-center text-xs text-gray-500 relative z-10">
                       <ArrowRight size={14} className="mr-2 text-blue-500"/>
                        <span>다음 <strong className="text-blue-600">{place.nextPlaceName}</strong>까지: </span>
                        <span className="font-medium ml-1">{(place.distanceToNext / 1000).toFixed(1)}km</span>
                        {place.travelTimeToNext && (
                            <span className="ml-1">({typeof place.travelTimeToNext === 'number' ? `${place.travelTimeToNext}분` : place.travelTimeToNext})</span>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground mt-10">
            <Calendar size={36} className="mb-2 mx-auto" />
            <p>이 날짜에 계획된 장소가 없습니다.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ItineraryView;
