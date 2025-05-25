import React, { useEffect, useRef } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
// Removed: import { useMapMarkers as useActualMapMarkersHook } from './hooks/useMapMarkers';
import { useMarkerRenderLogic } from './hooks/marker-utils/useMarkerRenderLogic';
import { useMarkerEventListeners } from './hooks/marker-utils/useMarkerEventListeners';
import { useMapContext } from './MapContext';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';


interface MapMarkersProps {
  places: Place[]; // General search/loaded places
  selectedPlace: Place | null; // For highlighting a specific place's info window
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null; // Currently selected itinerary day
  selectedPlaces?: Place[]; // For candidate markers (e.g. from category selection)
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string; // For highlighting a marker without opening info window
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
  console.log(`[MapMarkers] Render. SelectedDay: ${selectedDay}, Itinerary: ${itinerary?.length || 0} days, Highlight: ${highlightPlaceId}, SelectedPlace: ${selectedPlace?.name}`);

  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]);
  
  // Removed: useActualMapMarkersHook call and clearAllMarkersFromActualHook

  const { renderMarkers } = useMarkerRenderLogic({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
    markersRef,
    map,
    isMapInitialized,
    isNaverLoaded,
  });
  
  const forceMarkerUpdate = React.useCallback(() => {
    if (isMapInitialized && isNaverLoaded) {
      console.log('[MapMarkers] Forcing marker update via renderMarkers()');
      renderMarkers();
    } else {
      console.log('[MapMarkers] Cannot force marker update, map not ready.');
    }
  }, [isMapInitialized, isNaverLoaded, renderMarkers]);
  
  const clearAllMarkers = React.useCallback(() => {
      console.log('[MapMarkers] Clearing all markers from local markersRef.');
      // Simplified: clearAllMarkersFromActualHook is removed
      if (markersRef.current.length > 0) {
          // Use utility, ensures markersRef.current is reassigned to empty array
          markersRef.current = clearMarkersUtil(markersRef.current); 
          console.log('[MapMarkers] Cleared markers from local markersRef.');
      }
  }, [markersRef]); // Dependency array updated


  const prevSelectedDayRef = useRef<number | null>(selectedDay);
  useEffect(() => {
    prevSelectedDayRef.current = selectedDay;
  }, [selectedDay]);

  useMarkerEventListeners({
    clearAllMarkers, 
    forceMarkerUpdate,
    prevSelectedDayRef,
  });


  useEffect(() => {
    console.log(`[MapMarkers] Props changed. SelectedDay: ${selectedDay}, Itinerary length: ${itinerary?.length}, Places length: ${places.length}, Highlight: ${highlightPlaceId}, SelectedPlace: ${selectedPlace?.id}`);
    
    if (isMapInitialized && isNaverLoaded) {
       console.log('[MapMarkers] useEffect[selectedDay, itinerary, places, highlightPlaceId, selectedPlace]: Calling renderMarkers.');
       renderMarkers();
    } else {
       console.log('[MapMarkers] useEffect[...]: Map not ready, skipping renderMarkers.');
    }
  }, [selectedDay, itinerary, places, highlightPlaceId, selectedPlace, renderMarkers, isMapInitialized, isNaverLoaded]);


  useEffect(() => {
    return () => {
      console.log("[MapMarkers] Component unmounting - clearing all markers.");
      clearAllMarkers();
    };
  }, [clearAllMarkers]);

  return null; 
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  const changedProps: string[] = [];
  if (prevProps.selectedDay !== nextProps.selectedDay) changedProps.push('selectedDay');
  if (prevProps.itinerary !== nextProps.itinerary) changedProps.push('itinerary'); // Shallow compare is fine for array/null
  if (prevProps.places !== nextProps.places) changedProps.push('places'); // Shallow compare
  if (prevProps.selectedPlace?.id !== nextProps.selectedPlace?.id) changedProps.push('selectedPlace');
  if (prevProps.highlightPlaceId !== nextProps.highlightPlaceId) changedProps.push('highlightPlaceId');
  if (prevProps.selectedPlaces !== nextProps.selectedPlaces) changedProps.push('selectedPlaces'); // Shallow compare

  if (changedProps.length > 0) {
    console.log("[MapMarkers.memo] Re-rendering due to changed props:", changedProps.join(', '));
    return false; // Props are different, re-render
  }
  return true; // Props are the same, skip re-render
});
