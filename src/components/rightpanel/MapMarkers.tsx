
import React, { useEffect, useMemo } from 'react';
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

  // MapMarkers는 이제 Map.tsx에서 전달받은 places를 그대로 사용
  // Map.tsx에서 이미 올바른 일차의 장소들을 필터링해서 전달함
  const placesToDisplay = places;
  
  console.log('[MapMarkers] Received props:', {
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

  // Force marker update when selectedDay or places change - this is the key fix
  useEffect(() => {
    console.log(`[MapMarkers] Selected day or places changed (day: ${selectedDay}, places count: ${places.length}), forcing immediate marker update`);
    clearAllMarkers(); // Clear existing markers immediately
    
    // Use a very short delay to ensure state is updated
    const timeoutId = setTimeout(() => {
      forceMarkerUpdate(); // Force new markers to render
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [selectedDay, places, clearAllMarkers, forceMarkerUpdate]);

  // Log marker count for debugging
  useEffect(() => {
    console.log(`[MapMarkers] Current markers count: ${markers.length} for day ${selectedDay}`);
  }, [markers.length, selectedDay]);

  return null; // This component only manages markers, doesn't render JSX
};

export default React.memo(MapMarkers);
