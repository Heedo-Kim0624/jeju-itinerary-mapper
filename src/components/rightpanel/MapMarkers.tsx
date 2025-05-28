
import React, { useEffect } from 'react';
import { useMapMarkers } from './hooks/useMapMarkers';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';

interface MapMarkersProps {
  places: Place[]; 
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  // Get the current day's itinerary data
  const currentDayItinerary = selectedDay !== null && itinerary 
    ? itinerary.find(day => day.day === selectedDay) 
    : null;

  // Determine which places to display based on whether we're viewing a specific day
  const placesToDisplay = currentDayItinerary?.places || places;
  
  console.log('[MapMarkers] Rendering markers for:', {
    selectedDay,
    placesToDisplayCount: placesToDisplay.length,
    isItineraryDay: !!currentDayItinerary,
    places: placesToDisplay.map((p, idx) => ({ 
      index: idx + 1, 
      name: p.name, 
      x: p.x, 
      y: p.y 
    }))
  });

  const { markers, clearAllMarkers, forceMarkerUpdate } = useMapMarkers({
    places: placesToDisplay,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // Force marker update when selectedDay changes - this is the key fix
  useEffect(() => {
    console.log(`[MapMarkers] Selected day changed to ${selectedDay}, forcing immediate marker update`);
    clearAllMarkers(); // Clear existing markers immediately
    
    // Use a very short delay to ensure state is updated
    const timeoutId = setTimeout(() => {
      forceMarkerUpdate(); // Force new markers to render
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [selectedDay, clearAllMarkers, forceMarkerUpdate]);

  // Log marker count for debugging
  useEffect(() => {
    console.log(`[MapMarkers] Current markers count: ${markers.length} for day ${selectedDay}`);
  }, [markers.length, selectedDay]);

  return null; // This component only manages markers, doesn't render JSX
};

export default React.memo(MapMarkers);
