
import React from 'react';
import Map from './Map';
import { Place, ItineraryDay } from '@/types/supabase';

interface RightPanelProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
}

const RightPanel: React.FC<RightPanelProps> = ({
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
        itinerary={itinerary}
        selectedDay={selectedDay}
        selectedPlaces={selectedPlaces}
      />
    </div>
  );
};

export default RightPanel;
