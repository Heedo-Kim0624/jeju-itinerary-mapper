import React, { useEffect, useRef } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapMarkers as useActualMapMarkersHook } from './hooks/useMapMarkers'; // Renamed to avoid confusion
import { useMarkerRenderLogic } from './hooks/marker-utils/useMarkerRenderLogic';
import { useMarkerEventListeners } from './hooks/marker-utils/useMarkerEventListeners'; // If still needed
import { useMapContext } from './MapContext';


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
  
  const { clearAllMarkers: clearAllMarkersFromActualHook } = useActualMapMarkersHook({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });


  const { renderMarkers } = useMarkerRenderLogic({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
    markersRef,
    map, // map is passed to useMarkerRenderLogic, which might be fine if that hook expects it
    isMapInitialized,
    isNaverLoaded,
  });
  
  // forceMarkerUpdate function for event listeners
  const forceMarkerUpdate = React.useCallback(() => {
    if (isMapInitialized && isNaverLoaded) {
      console.log('[MapMarkers] Forcing marker update via renderMarkers()');
      renderMarkers();
    } else {
      console.log('[MapMarkers] Cannot force marker update, map not ready.');
    }
  }, [isMapInitialized, isNaverLoaded, renderMarkers]);
  
  const clearAllMarkers = React.useCallback(() => {
      console.log('[MapMarkers] Clearing all markers.');
      if (clearAllMarkersFromActualHook && typeof clearAllMarkersFromActualHook === 'function') {
        console.log('[MapMarkers] Calling clearAllMarkersFromActualHook.');
        clearAllMarkersFromActualHook(); // Clears markers managed by useActualMapMarkersHook
      } else {
        console.warn('[MapMarkers] clearAllMarkersFromActualHook is not available or not a function.');
      }
      // Also clear markersRef which is used by useMarkerRenderLogic
      if (markersRef.current.length > 0) {
          markersRef.current.forEach(marker => {
              if(marker && typeof marker.setMap === 'function') marker.setMap(null);
          });
          markersRef.current = [];
          console.log('[MapMarkers] Cleared markers from local markersRef.');
      }
  }, [clearAllMarkersFromActualHook, markersRef]);


  // Event listeners for global state changes (e.g., generation start, external day selection)
  // These might be redundant if prop changes are handled well.
  // prevSelectedDayRef is used by useMarkerEventListeners
  const prevSelectedDayRef = useRef<number | null>(selectedDay);
  useEffect(() => {
    prevSelectedDayRef.current = selectedDay;
  }, [selectedDay]);

  useMarkerEventListeners({
    clearAllMarkers, // Pass our combined clearAllMarkers
    forceMarkerUpdate,
    prevSelectedDayRef,
  });


  // Main effect for re-rendering markers when relevant props change
  useEffect(() => {
    console.log(`[MapMarkers] Props changed. SelectedDay: ${selectedDay}, Itinerary length: ${itinerary?.length}, Places length: ${places.length}, Highlight: ${highlightPlaceId}, SelectedPlace: ${selectedPlace?.id}`);
    
    if (isMapInitialized && isNaverLoaded) {
       console.log('[MapMarkers] useEffect[selectedDay, itinerary, places, highlightPlaceId, selectedPlace]: Calling renderMarkers.');
       renderMarkers();
    } else {
       console.log('[MapMarkers] useEffect[...]: Map not ready, skipping renderMarkers.');
    }
  }, [selectedDay, itinerary, places, highlightPlaceId, selectedPlace, renderMarkers, isMapInitialized, isNaverLoaded]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[MapMarkers] Component unmounting - clearing all markers.");
      clearAllMarkers();
    };
  }, [clearAllMarkers]);

  return null; // This component doesn't render DOM itself
};

// React.memo comparison function
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
