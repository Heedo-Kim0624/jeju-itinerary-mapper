
import React, { useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapMarkers } from './hooks/useMapMarkers';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedPlaces?: Place[]; 
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  // Debug diagnostic for component render
  console.log(`[MapMarkers] Component rendered, itinerary: ${itinerary?.length || 0} days`);
  
  const { forceMarkerUpdate, clearAllMarkers } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // Enhanced diagnostic for key props changes
  useEffect(() => {
    console.log(`[MapMarkers] itinerary: ${itinerary ? `${itinerary.length} days` : 'null'}`);
    
    const timer = setTimeout(() => {
      console.log('[MapMarkers] Forcing marker update due to itinerary change');
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [itinerary, forceMarkerUpdate]);

  // Explicit handler for route generation event
  useEffect(() => {
    const handleStartScheduleGeneration = () => {
      console.log("[MapMarkers] startScheduleGeneration event detected - clearing all markers");
      clearAllMarkers();
    };
    
    // Explicit handler for day selection event
    const handleDaySelected = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[MapMarkers] itineraryDaySelected event detected - day: ${event.detail.day}`);
        setTimeout(() => {
          console.log('[MapMarkers] Forcing marker update due to day selection event');
          forceMarkerUpdate();
        }, 100);
      }
    };
    
    console.log("[MapMarkers] Registering direct event handlers");
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    window.addEventListener('itineraryDaySelected', handleDaySelected);
    
    return () => {
      console.log("[MapMarkers] Removing direct event handlers");
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
      window.removeEventListener('itineraryDaySelected', handleDaySelected);
    };
  }, [clearAllMarkers, forceMarkerUpdate]);

  // Add an unmount diagnostic
  useEffect(() => {
    return () => {
      console.log("[MapMarkers] Component unmounting - cleaning up");
    };
  }, []);

  return null;
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  // Enhanced comparison logic with diagnostics
  const isSameSelectedPlace = prevProps.selectedPlace?.id === nextProps.selectedPlace?.id;
  const isSameHighlightId = prevProps.highlightPlaceId === nextProps.highlightPlaceId;
  
  const prevItineraryLength = prevProps.itinerary?.length || 0;
  const nextItineraryLength = nextProps.itinerary?.length || 0;
  const isSameItineraryLength = prevItineraryLength === nextItineraryLength;
  
  const isSamePlacesLength = prevProps.places.length === nextProps.places.length;
  
  const shouldUpdate = !isSameItineraryLength;
  
  if (shouldUpdate) {
    console.log("[MapMarkers] Memo comparison detected change - will re-render", {
      isSameItineraryLength,
      prevItineraryLength,
      nextItineraryLength,
    });
  }
  
  return isSameSelectedPlace && isSameHighlightId && isSamePlacesLength && isSameItineraryLength;
});
