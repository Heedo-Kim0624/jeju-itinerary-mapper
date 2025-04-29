
import React from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
import { useScheduleGenerator } from '@/hooks/use-schedule-generator';
import ScheduleViewer from './ScheduleViewer';

interface LeftPanelContainerProps {
  showItinerary: boolean;
  onSetShowItinerary: (show: boolean) => void;
  selectedPlaces: Place[];
  onRemovePlace: (id: string) => void;
  onViewOnMap: (place: Place) => void;
  allCategoriesSelected: boolean;
  children: React.ReactNode;
  dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  } | null;
}

const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  showItinerary,
  onSetShowItinerary,
  selectedPlaces,
  onRemovePlace,
  onViewOnMap,
  allCategoriesSelected,
  children,
  dates
}) => {
  const {
    schedule,
    loading,
    error,
    selectedDay,
    setSelectedDay,
    generateSchedule
  } = useScheduleGenerator();

  const handleCreateItinerary = () => {
    if (!dates) {
      toast.error("여행 날짜와 시간을 먼저 선택해주세요.");
      return;
    }
    if (selectedPlaces.length === 0) {
      toast.error("장소를 먼저 선택해주세요.");
      return;
    }

    const payload = {
      selected_places: selectedPlaces.map(place => ({
        id: place.id.toString(),
        name: place.name
      })),
      candidate_places: [], // 필요에 따라 구현
      start_datetime: `${dates.startDate.toISOString().split('T')[0]}T${dates.startTime}:00`,
      end_datetime: `${dates.endDate.toISOString().split('T')[0]}T${dates.endTime}:00`
    };

    generateSchedule(payload);
    onSetShowItinerary(true);
    
    // 로그 메시지 추가
    console.log("일정 생성 요청 완료:", {
      선택된_장소: selectedPlaces.length,
      시작_날짜: dates.startDate,
      종료_날짜: dates.endDate
    });
    
    toast.success("일정 생성 요청을 완료했습니다.");
  };

  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
    setSelectedDay(null);
  };

  if (showItinerary) {
    return (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        <ScheduleViewer
          schedule={schedule}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          onClose={handleCloseItinerary}
        />
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
      {children}
      <div className="px-4 mb-4">
        <PlaceCart 
          selectedPlaces={selectedPlaces} 
          onRemovePlace={onRemovePlace}
          onViewOnMap={onViewOnMap}
        />
        <ItineraryButton 
          allCategoriesSelected={allCategoriesSelected}
          onCreateItinerary={handleCreateItinerary}
        />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
