
import React, { useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapMarkers } from './hooks/useMapMarkers';

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
  // Debug diagnostic for component render
  console.log(`[MapMarkers] Component rendered with selectedDay: ${selectedDay}, itinerary: ${itinerary?.length || 0} days`);
  
  const { forceMarkerUpdate, clearAllMarkers } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // Enhanced diagnostic for key props changes
  useEffect(() => {
    console.log(`[MapMarkers] selectedDay changed to: ${selectedDay}`);
    console.log(`[MapMarkers] itinerary: ${itinerary ? `${itinerary.length} days` : 'null'}`);
    if (selectedDay !== null && itinerary) {
      const dayData = itinerary.find(day => day.day === selectedDay);
      console.log(`[MapMarkers] Selected day ${selectedDay} has ${dayData?.places?.length || 0} places`);
    }
    
    const timer = setTimeout(() => {
      console.log('[MapMarkers] Forcing marker update due to selectedDay/itinerary change');
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [selectedDay, itinerary, forceMarkerUpdate]);

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
  const isSameSelectedDay = prevProps.selectedDay === nextProps.selectedDay;
  const isSameSelectedPlace = prevProps.selectedPlace?.id === nextProps.selectedPlace?.id;
  const isSameHighlightId = prevProps.highlightPlaceId === nextProps.highlightPlaceId;
  
  const prevItineraryLength = prevProps.itinerary?.length || 0;
  const nextItineraryLength = nextProps.itinerary?.length || 0;
  const isSameItineraryLength = prevItineraryLength === nextItineraryLength;
  
  const isSamePlacesLength = prevProps.places.length === nextProps.places.length;
  
  const shouldUpdate = !isSameSelectedDay || !isSameItineraryLength;
  
  if (shouldUpdate) {
    console.log("[MapMarkers] Memo comparison detected change - will re-render", {
      isSameSelectedDay,
      isSameItineraryLength,
      prevSelectedDay: prevProps.selectedDay,
      nextSelectedDay: nextProps.selectedDay,
    });
  }
  
  return isSameSelectedPlace && isSameHighlightId && isSamePlacesLength && isSameSelectedDay && isSameItineraryLength;
});
