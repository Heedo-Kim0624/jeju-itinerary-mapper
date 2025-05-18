
import React from 'react';
import Map from './Map';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/types/schedule'; // Changed to use ItineraryDay from schedule.ts

interface MapContainerProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null; // Now uses schedule.ts ItineraryDay
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
  return (
    <div className="w-full h-full">
      <Map
        places={places}
        selectedPlace={selectedPlace}
        itinerary={itinerary} // itinerary is now schedule.ItineraryDay[]
        selectedDay={selectedDay}
        selectedPlaces={selectedPlaces}
      />
    </div>
  );
};

export default MapContainer;
