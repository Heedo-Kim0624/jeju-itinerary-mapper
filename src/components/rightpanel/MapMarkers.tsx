import React, { useEffect, useRef, useMemo } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
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
  showOnlyCurrentDayMarkers?: boolean; // New flag to control filtering behavior
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
  showOnlyCurrentDayMarkers = false,
}) => {
  const loggingPrefix = '[MapMarkers]';
  console.log(`${loggingPrefix} Render. SelectedDay: ${selectedDay}, Itinerary: ${itinerary?.length || 0} days, Highlight: ${highlightPlaceId}, SelectedPlace: ${selectedPlace?.name}`);

  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]);
  
  // Determine which places to render based on the current day selection
  const placesToRender = useMemo(() => {
    if (selectedDay !== null && itinerary && showOnlyCurrentDayMarkers) {
      const currentDay = itinerary.find(day => day.day === selectedDay);
      if (currentDay && currentDay.places && currentDay.places.length > 0) {
        console.log(`${loggingPrefix} Using filtered places for day ${selectedDay}. Count: ${currentDay.places.length}`);
        return currentDay.places;
      }
    }
    return places;
  }, [places, itinerary, selectedDay, showOnlyCurrentDayMarkers]);
  
  const { renderMarkers } = useMarkerRenderLogic({
    places: placesToRender,
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
      console.log(`${loggingPrefix} Forcing marker update via renderMarkers()`);
      renderMarkers();
    }
  }, [isMapInitialized, isNaverLoaded, renderMarkers]);
  
  const clearAllMarkers = React.useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`${loggingPrefix} Clearing ${markersRef.current.length} markers`);
      markersRef.current = clearMarkersUtil(markersRef.current); 
    }
  }, [markersRef]);

  // Keep track of previous selected day for proper cleanup
  const prevSelectedDayRef = useRef<number | null>(selectedDay);
  useEffect(() => {
    if (prevSelectedDayRef.current !== selectedDay) {
      console.log(`${loggingPrefix} Selected day changed: ${prevSelectedDayRef.current} -> ${selectedDay}. Clearing markers.`);
      clearAllMarkers();
      prevSelectedDayRef.current = selectedDay;
    }
  }, [selectedDay, clearAllMarkers]);

  useMarkerEventListeners({
    clearAllMarkers, 
    forceMarkerUpdate,
    prevSelectedDayRef,
  });

  // Main effect for rendering markers
  useEffect(() => {
    const logProps = {
      day: selectedDay, 
      itineraryLength: itinerary?.length, 
      placesCount: placesToRender.length, 
      highlight: highlightPlaceId, 
      selected: selectedPlace?.id
    };
    
    console.log(`${loggingPrefix} Props changed:`, logProps);
    
    if (isMapInitialized && isNaverLoaded) {
      console.log(`${loggingPrefix} Rendering markers for ${placesToRender.length} places`);
      clearAllMarkers(); // Always clear before rendering new markers
      renderMarkers();
    }
  }, [
    placesToRender, // Use the filtered places instead of all places
    selectedPlace,
    highlightPlaceId,
    isMapInitialized,
    isNaverLoaded,
    renderMarkers,
    clearAllMarkers
  ]);

  // Unmounting cleanup
  useEffect(() => {
    return () => {
      console.log(`${loggingPrefix} Component unmounting - clearing all markers.`);
      clearAllMarkers();
    };
  }, [clearAllMarkers]);

  return null; 
};

// Use React.memo with custom comparison to prevent unnecessary re-renders
export default React.memo(MapMarkers, (prevProps, nextProps) => {
  const changedProps: string[] = [];
  
  // Compare the placesToRender instead of raw places
  const prevHasSelectedDay = prevProps.selectedDay !== null;
  const nextHasSelectedDay = nextProps.selectedDay !== null;
  
  if (prevProps.selectedDay !== nextProps.selectedDay) changedProps.push('selectedDay');
  if (prevProps.itinerary !== nextProps.itinerary) changedProps.push('itinerary');
  
  // For places, we only care if the places we're actually rendering have changed
  if (prevHasSelectedDay !== nextHasSelectedDay) changedProps.push('placesFilteringMode');
  
  // Only compare places if we're in the same mode (selected day vs general places)
  if (!prevHasSelectedDay && !nextHasSelectedDay && prevProps.places !== nextProps.places) {
    changedProps.push('places');
  }
  
  if (prevProps.selectedPlace?.id !== nextProps.selectedPlace?.id) changedProps.push('selectedPlace');
  if (prevProps.highlightPlaceId !== nextProps.highlightPlaceId) changedProps.push('highlightPlaceId');
  if (prevProps.selectedPlaces !== nextProps.selectedPlaces) changedProps.push('selectedPlaces');
  if (prevProps.showOnlyCurrentDayMarkers !== nextProps.showOnlyCurrentDayMarkers) changedProps.push('showOnlyCurrentDayMarkers');

  if (changedProps.length > 0) {
    console.log(`[MapMarkers.memo] Re-rendering due to changed props: ${changedProps.join(', ')}`);
    return false; // Props are different, re-render
  }
  return true; // Props are the same, skip re-render
});
