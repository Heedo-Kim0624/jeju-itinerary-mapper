import React, { useState, useEffect } from 'react';
import MapContainer from './MapContainer';
import { Place } from '@/types/supabase';
import { ItineraryDay as ScheduleItineraryDay } from '@/types/schedule';
import ItineraryControls from '../leftpanel/ItineraryControls';
import { useMapContext } from './MapContext';

interface RightPanelProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ScheduleItineraryDay[] | null;
  selectedDay: number | null;
}

const RightPanel: React.FC<RightPanelProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
}) => {
  const { map, setMap } = useMapContext();
  const [userInteracted, setUserInteracted] = useState(false);
  const [currentItinerary, setCurrentItinerary] = useState<ScheduleItineraryDay[] | null>(itinerary);
  const [currentSelectedDay, setCurrentSelectedDay] = useState<number | null>(selectedDay);

  useEffect(() => {
    setCurrentItinerary(itinerary);
    if (itinerary && itinerary.length > 0 && !selectedDay) {
      setCurrentSelectedDay(itinerary[0].day);
    } else {
      setCurrentSelectedDay(selectedDay);
    }
  }, [itinerary, selectedDay]);
  
  const handleUserInteraction = () => {
    setUserInteracted(true);
  };

  const handleDayChange = (day: number) => {
    setCurrentSelectedDay(day);
    setUserInteracted(true); // 사용자가 날짜를 변경했음을 표시
  };

  return (
    <div className="w-3/4 h-full relative" onClick={handleUserInteraction}>
      <MapContainer
        places={places}
        selectedPlace={selectedPlace}
        itinerary={currentItinerary}
        selectedDay={currentSelectedDay}
        selectedPlaces={places} // selectedPlaces를 전달해야 할 수 있음
      />
      {currentItinerary && currentItinerary.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded shadow">
          <ItineraryControls
            itinerary={currentItinerary}
            selectedDay={currentSelectedDay}
            onDayChange={handleDayChange}
          />
        </div>
      )}
    </div>
  );
};

export default RightPanel;
