
import React from 'react';
import DaySelector from './DaySelector';
import { usePopup } from '@/hooks/ui/usePopup'; 
import PlaceDetailDialog from '@/components/places/PlaceDetailDialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { ItineraryDay } from '@/types/core';

interface ItineraryViewProps {
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onClose: () => void;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  selectedDay,
  onSelectDay,
  onClose,
}) => {
  // 상세 정보 팝업을 위한 훅 사용
  const { isPopupOpen, selectedPlace, openPopup, handleOpenChange } = usePopup();

  if (!itinerary || itinerary.length === 0 || selectedDay === null) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <p>일정이 비어있습니다</p>
      </div>
    );
  }

  // 현재 선택된 일정 데이터 찾기
  const currentDayData = itinerary.find((day) => day.day === selectedDay);
  if (!currentDayData) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <p>선택된 일정을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pb-16">
      <DaySelector
        itinerary={itinerary}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
      />
      
      <div className="overflow-auto flex-1 px-4 pt-4 mt-16">
        <h2 className="text-lg font-semibold mb-4">
          {selectedDay}일차 ({currentDayData.date}, {currentDayData.dayOfWeek})
        </h2>
        
        <div className="space-y-4">
          {currentDayData.places.map((place, index) => (
            <div
              key={`place-${place.id}-${index}`}
              className="bg-white rounded-lg p-4 shadow-sm border"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-base">{place.name}</h3>
                  <p className="text-sm text-muted-foreground">{place.category}</p>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium">
                    {place.arriveTime || (place.timeBlock && place.timeBlock.split('_')[1])}
                  </span>
                  {place.travelTimeToNext && (
                    <span className="text-xs text-muted-foreground">
                      다음 장소까지 {place.travelTimeToNext}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-2">
                {/* 상세 정보 버튼 추가 */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => openPopup(place)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  상세 정보
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 상세 정보 팝업 다이얼로그 */}
      <PlaceDetailDialog 
        place={selectedPlace} 
        open={isPopupOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

export default ItineraryView;
