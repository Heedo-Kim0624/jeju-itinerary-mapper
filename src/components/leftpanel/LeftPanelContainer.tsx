
import React from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/hooks/use-itinerary-creator';
import PlaceCart from './PlaceCart';
import ItineraryButton from './ItineraryButton';
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
  onCreateItinerary: () => void;
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
  isItineraryMode?: boolean;
}

const LeftPanelContainer: React.FC<LeftPanelContainerProps> = ({
  showItinerary,
  onSetShowItinerary,
  selectedPlaces,
  onRemovePlace,
  onViewOnMap,
  allCategoriesSelected,
  children,
  dates,
  onCreateItinerary,
  itinerary,
  selectedItineraryDay,
  onSelectDay,
  isItineraryMode = false
}) => {
  const handleCloseItinerary = () => {
    onSetShowItinerary(false);
  };

  // isItineraryMode가 true이고 itinerary가 있으면 일정 뷰를 보여줌
  if ((showItinerary || isItineraryMode) && itinerary) {
    console.log("LeftPanelContainer: 일정 뷰 표시", {
      showItinerary,
      isItineraryMode,
      itineraryExists: !!itinerary
    });
    
    return (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        <ScheduleViewer
          schedule={itinerary}
          selectedDay={selectedItineraryDay}
          onDaySelect={onSelectDay}
          onClose={handleCloseItinerary}
          startDate={dates?.startDate || new Date()}
        />
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
      <div className="flex-1 overflow-auto">
        {children}
      </div>
      <div className="px-4 py-4 border-t">
        <PlaceCart 
          selectedPlaces={selectedPlaces} 
          onRemovePlace={onRemovePlace}
          onViewOnMap={onViewOnMap}
        />
        <ItineraryButton 
          allCategoriesSelected={allCategoriesSelected}
          onCreateItinerary={onCreateItinerary}
        />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
