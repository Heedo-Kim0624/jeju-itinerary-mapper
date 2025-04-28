
import React from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
import LeftPanelContent from './LeftPanelContent';
import { ScheduleGenerator } from './ScheduleGenerator';
import { useItinerary } from '@/hooks/use-itinerary';

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
    setItinerary,
    setSelectedItineraryDay,
    handleSelectItineraryDay,
    generateItinerary
  } = useItinerary();

  const handleCreateItinerary = () => {
    if (!dates) {
      toast.error("여행 날짜와 시간을 먼저 선택해주세요.");
      return;
    }
    if (selectedPlaces.length === 0) {
      toast.error("장소를 먼저 선택해주세요.");
      return;
    }

    // 일정 생성 및 상태 업데이트
    if (dates) {
      generateItinerary(
        selectedPlaces,
        dates.startDate,
        dates.endDate,
        dates.startTime,
        dates.endTime
      );
    }
    
    onSetShowItinerary(true);
  };

  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
    setSelectedItineraryDay(null);
  };

  if (showItinerary) {
    return (
      <div className="absolute inset-0 z-10 bg-white">
        <ScheduleGenerator
          selectedPlaces={selectedPlaces}
          dates={dates}
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
