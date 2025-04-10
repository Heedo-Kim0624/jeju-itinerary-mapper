
import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay } from '@/types/supabase';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
}) => {
  const { isMapInitialized, calculateRoutes, addMarkers } = useMapContext();

  useEffect(() => {
    if (!isMapInitialized) {
      return;
    }

    renderData();
  }, [places, selectedPlace, itinerary, selectedDay, selectedPlaces, isMapInitialized]);

  const renderData = () => {
    if (!isMapInitialized) {
      console.warn("Map is not yet initialized.");
      return;
    }

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const selectedItinerary = itinerary.find(day => day.day === selectedDay);
      if (selectedItinerary) {
        addMarkers(selectedItinerary.places, true);
        calculateRoutes(selectedItinerary.places);
      } else {
        console.warn(`No itinerary found for day ${selectedDay}`);
        addMarkers(places);
      }
    } else if (selectedPlaces && selectedPlaces.length > 0) {
      addMarkers(selectedPlaces);
    } else {
      addMarkers(places);
    }
  };

  return null; // This component doesn't render anything, it just adds markers to the map
};

export default MapMarkers;
