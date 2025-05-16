
import React from 'react';
import { format, addDays } from 'date-fns'; // addDays 추가
import { ko } from 'date-fns/locale';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Clock, Navigation, Tag, MapPin, Calendar } from 'lucide-react'; // Tag, MapPin, Calendar 아이콘 추가
import { getCategoryName } from '@/utils/categoryColors'; // 카테고리 이름 변환 함수 사용

interface ScheduleViewerProps {
  schedule?: ItineraryDay[];
  selectedDay?: number | null;
  onDaySelect?: (day: number) => void;
  onClose?: () => void;
  startDate?: Date; // 일정 시작일 (필수 아님, fallback으로 new Date())
  // itineraryDay prop은 제거하고 schedule과 selectedDay를 통해 현재 날짜 데이터 사용
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
  schedule,
  selectedDay,
  onDaySelect,
  onClose,
  startDate = new Date(), // startDate가 없으면 오늘 날짜 기준으로 계산
}) => {
  // itineraryDay prop 제거로 인한 currentDay 로직 수정
  const currentDayData = selectedDay !== null && schedule 
    ? schedule.find(d => d.day === selectedDay) 
    : null;

  const getFormattedDateForDay = (dayNumber: number): string => {
    if (!currentDayData?.originalDayString) { // originalDayString (예: "Tue")이 없으면 날짜 계산
        const date = addDays(startDate, dayNumber - 1);
        return format(date, 'yyyy년 MM월 dd일 (eee)', { locale: ko });
    }
    // originalDayString이 있으면 그것과 함께 표시 (더 정확한 날짜 표기를 위해 startDate 필요)
    const date = addDays(startDate, dayNumber - 1); // startDate 기준으로 날짜 계산
    return `${format(date, 'yyyy년 MM월 dd일')} (${currentDayData.originalDayString})`;
  };


  if (!schedule || schedule.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">여행 일정</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm text-blue-600 hover:underline"
            >
              ← 뒤로
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
          <p>생성된 일정이 없습니다. 장소를 선택하고 일정을 생성해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex items-center justify-between p-4 border-b bg-white">
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

      {/* 일자 선택 탭 */}
      <div className="flex overflow-x-auto p-3 gap-2 border-b bg-white shadow-sm">
        {schedule.map((dayItem) => {
          const dayDate = addDays(new Date(startDate), dayItem.day - 1);
          const formattedTabDate = format(dayDate, 'MM/dd(EEE)', { locale: ko });
          
          return (
            <Button
              key={dayItem.day}
              variant={selectedDay === dayItem.day ? "default" : "outline"}
              className={`flex flex-col h-auto min-w-[70px] p-2 whitespace-nowrap ${selectedDay === dayItem.day ? 'shadow-md' : 'hover:bg-slate-100'}`}
              onClick={() => onDaySelect && onDaySelect(dayItem.day)}
            >
              <span className="font-bold text-sm">{dayItem.day}일차</span>
              <span className="text-xs mt-0.5">{formattedTabDate}</span>
            </Button>
          );
        })}
      </div>

      <ScrollArea className="flex-1">
        {currentDayData ? (
          <div className="p-4">
            <div className="mb-4 p-3 bg-white rounded-lg shadow">
              <div className="flex items-center text-indigo-700 font-semibold">
                <Calendar className="w-5 h-5 mr-2"/>
                <h3 className="text-md">
                  {currentDayData.day}일차: {getFormattedDateForDay(currentDayData.day)}
                </h3>
              </div>
              <div className="text-sm text-muted-foreground mt-1 ml-7">
                총 이동 거리: {currentDayData.totalDistance.toFixed(1)} km
              </div>
            </div>
            
            <div className="space-y-3 relative">
              {/* 타임라인 가이드 라인 - 디자인 개선 */}
              {currentDayData.places.length > 1 && (
                <div className="absolute top-5 bottom-5 left-[22px] w-0.5 bg-slate-300 z-0"></div>
              )}
              
              {currentDayData.places.map((place, idx) => (
                <div key={place.id || `place-${idx}`} className="flex items-start relative z-10">
                  {/* 시간 블록 또는 순번 마커 */}
                  <div className="flex flex-col items-center mr-3">
                     <div className="h-11 w-11 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center border-2 border-white shadow-md z-10 text-lg">
                        {idx + 1}
                     </div>
                     {/* 시간 정보가 있다면 아래에 표시 */}
                     {place.timeBlock && place.timeBlock !== "시간 정보 없음" && (
                        <span className="text-xs text-indigo-600 mt-1 whitespace-nowrap">{place.timeBlock}</span>
                     )}
                  </div>
                  
                  <div className="flex-1 border rounded-lg p-3 bg-white shadow-sm min-w-0"> {/* min-w-0 for flex truncation */}
                    <div className="font-medium text-slate-800 truncate" title={place.name}>{place.name}</div>
                    
                    <div className="flex items-center mt-1 text-xs text-slate-500">
                      <Tag className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span>{getCategoryName(place.category)}</span>
                    </div>
                    
                    {place.address && place.address !== "주소 정보 없음" && (
                         <div className="flex items-center mt-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
                            <span className="truncate" title={place.address}>{place.address}</span>
                         </div>
                    )}
                    
                    {/* 이동 시간 등 추가 정보 (필요시) */}
                    {idx < currentDayData.places.length - 1 && place.travelTimeToNext && place.travelTimeToNext !== "-" && (
                      <div className="flex items-center mt-1.5 pt-1.5 border-t border-slate-100 text-xs text-sky-600">
                        <Navigation className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span>다음 장소까지: {place.travelTimeToNext}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
            일자를 선택하여 상세 일정을 확인하세요.
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ScheduleViewer;
