
import React, { useEffect, useRef } from 'react';
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
  // Use ref to track whether map component has been mounted
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Debug log to track map container rendering
  useEffect(() => {
    console.log("MapContainer rendered", {
      placesCount: places.length,
      hasSelectedPlace: !!selectedPlace,
      hasItinerary: !!itinerary,
      selectedDay,
      mounted: mountedRef.current
    });
  });

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

export default React.memo(MapContainer); // Use memo to prevent unnecessary re-renders
