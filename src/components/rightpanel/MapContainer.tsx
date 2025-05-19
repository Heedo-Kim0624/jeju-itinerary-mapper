
import React from 'react';
import Map from './Map';
import { Place, ItineraryDay } from '@/types/supabase';

interface MapContainerProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
}

const MapContainer: React.FC<MapContainerProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
}) => {
  // selectedDay가 number 타입으로 오지만, Map에는 ItineraryDay | null이 필요함
  const selectedItineraryDay = selectedDay !== null && itinerary ? 
    itinerary.find(day => day.day === selectedDay) || null : null;

  return (
    <div className="w-full h-full">
      <Map
        places={places}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedItineraryDay={selectedItineraryDay}
        selectedPlacesForMap={selectedPlaces}
      />
    </div>
  );
};

export default MapContainer;
