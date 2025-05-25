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
  console.log(`[MapMarkers] Component rendered, itinerary: ${itinerary?.length || 0} days`);
  
  const { forceMarkerUpdate, clearAllMarkers } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  useEffect(() => {
    console.log(`[MapMarkers] itinerary: ${itinerary ? `${itinerary.length} days` : 'null'}`);
    
    const timer = setTimeout(() => {
      console.log('[MapMarkers] Forcing marker update due to itinerary change');
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [itinerary, forceMarkerUpdate]);

  useEffect(() => {
    const handleStartScheduleGeneration = () => {
      console.log("[MapMarkers] startScheduleGeneration event detected - clearing all markers");
      clearAllMarkers();
    };
    
    const handleDaySelected = (event: any) => {
      const day = event.day ?? event.detail?.day;
      if (typeof day === 'number') {
        console.log(`[MapMarkers] mapDayChanged (or similar) event detected - day: ${day}`);
        setTimeout(() => {
          console.log('[MapMarkers] Forcing marker update due to day selection event');
          forceMarkerUpdate();
        }, 100);
      }
    };
    
    console.log("[MapMarkers] Registering direct event handlers for window events and custom EventEmitter");
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    
    const { EventEmitter } = await import('@/hooks/events/useEventEmitter');
    const unsubscribe = EventEmitter.subscribe('mapDayChanged', handleDaySelected);
    
    return () => {
      console.log("[MapMarkers] Removing event handlers");
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
      unsubscribe();
    };
  }, [clearAllMarkers, forceMarkerUpdate]);

  useEffect(() => {
    return () => {
      console.log("[MapMarkers] Component unmounting - cleaning up");
    };
  }, []);

  return null;
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  const isSameSelectedPlace = prevProps.selectedPlace?.id === nextProps.selectedPlace?.id;
  const isSameHighlightId = prevProps.highlightPlaceId === nextProps.highlightPlaceId;
  
  const prevItineraryLength = prevProps.itinerary?.length || 0;
  const nextItineraryLength = nextProps.itinerary?.length || 0;
  const isSameItineraryLength = prevItineraryLength === nextItineraryLength;
  
  const isSamePlacesLength = prevProps.places.length === nextProps.places.length;
  const isSameSelectedPlacesLength = (prevProps.selectedPlaces?.length || 0) === (nextProps.selectedPlaces?.length || 0);
  
  const shouldUpdate = !isSameItineraryLength || !isSamePlacesLength || !isSameSelectedPlacesLength;
  
  if (shouldUpdate) {
    console.log("[MapMarkers] Memo comparison detected change - will re-render", {
      isSameItineraryLength, prevItineraryLength, nextItineraryLength,
      isSamePlacesLength, prevPlacesLength: prevProps.places.length, nextPlacesLength: nextProps.places.length,
      isSameSelectedPlacesLength, prevSelectedPlacesLength: prevProps.selectedPlaces?.length, nextSelectedPlacesLength: nextProps.selectedPlaces?.length,
    });
  }
  
  return isSameSelectedPlace && isSameHighlightId && isSamePlacesLength && isSameItineraryLength && isSameSelectedPlacesLength;
});
