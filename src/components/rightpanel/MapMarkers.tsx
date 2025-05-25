
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMarkerRenderLogic } from './hooks/marker-utils/useMarkerRenderLogic';
// import { useMarkerEventListeners } from './hooks/marker-utils/useMarkerEventListeners'; // Not used directly if event handling changes
import { useMapContext } from './MapContext';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

interface MapMarkersProps {
  places: Place[]; // General search/loaded places, OR all places of the itinerary if selectedDay is null
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
  showOnlyCurrentDayMarkers?: boolean; // This prop will be effectively always true due to filtering logic
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places: allPlaces, // Renamed to allPlaces to avoid confusion with placesToRender
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
  // showOnlyCurrentDayMarkers prop is kept for signature but logic relies on selectedDay
}) => {
  const loggingPrefix = '[MapMarkers]';
  console.log(`${loggingPrefix} Render. SelectedDay: ${selectedDay}, Itinerary: ${itinerary?.length || 0} days, Highlight: ${highlightPlaceId}, SelectedPlace: ${selectedPlace?.name}`);

  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]);
  
  const placesToRender = useMemo(() => {
    if (selectedDay !== null && itinerary) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        console.log(`${loggingPrefix} Using filtered places for day ${selectedDay}. Count: ${currentDayData.places.length}`);
        return currentDayData.places;
      }
      // If selectedDay is set but no places for that day, return empty array to show no markers for that day
      console.log(`${loggingPrefix} No places found for selected day ${selectedDay}, returning empty array.`);
      return []; 
    }
    // If no day selected, or no itinerary, use allPlaces (general places)
    console.log(`${loggingPrefix} No selected day or itinerary, using allPlaces. Count: ${allPlaces.length}`);
    return allPlaces;
  }, [allPlaces, itinerary, selectedDay]);
  
  const { renderMarkers } = useMarkerRenderLogic({
    places: placesToRender, // Pass the correctly filtered places
    selectedPlace,
    itinerary, // Pass full itinerary for context
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
    markersRef,
    map,
    isMapInitialized,
    isNaverLoaded,
  });
  
  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`${loggingPrefix} Clearing ${markersRef.current.length} markers`);
      markersRef.current = clearMarkersUtil(markersRef.current); 
    }
  }, []); // Empty dependency array, markersRef is stable

  // Effect for rendering markers when relevant props change OR map becomes ready.
  // This handles initial render and changes to selectedPlace/highlightPlaceId.
  // Day-specific changes will be primarily driven by 'routeRenderingComplete'.
  useEffect(() => {
    if (isMapInitialized && isNaverLoaded) {
      console.log(`${loggingPrefix} Key props or map readiness changed. Rendering markers for ${placesToRender.length} places. Selected: ${selectedPlace?.id}, Highlight: ${highlightPlaceId}`);
      clearAllMarkers();
      renderMarkers();
    }
  }, [
    placesToRender, // This will change when selectedDay changes, triggering a render
    selectedPlace,
    highlightPlaceId,
    isMapInitialized, 
    isNaverLoaded,
    renderMarkers, // Stable due to useCallback in useMarkerRenderLogic
    clearAllMarkers // Stable
  ]);

  // Listen for route rendering completion to synchronize markers
  useEffect(() => {
    const handleRouteRenderingComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ day: number | null; status: string }>;
      console.log(`${loggingPrefix} Event 'routeRenderingComplete' received for day ${customEvent.detail.day}, status: ${customEvent.detail.status}. Current selectedDay: ${selectedDay}`);
      // Ensure markers are updated for the *currently selected day* after routes are ready
      if (isMapInitialized && isNaverLoaded) {
         // Check if the event is for the currently selected day or if selectedDay is null (global clear)
        if (customEvent.detail.day === selectedDay) {
            console.log(`${loggingPrefix} Route sync: Clearing and rendering markers for day ${selectedDay}.`);
            clearAllMarkers();
            renderMarkers(); // renderMarkers uses placesToRender, which is already filtered for selectedDay
        } else if (selectedDay === null && customEvent.detail.day === null) {
            console.log(`${loggingPrefix} Route sync: Global clear, clearing and rendering markers (likely general places).`);
            clearAllMarkers();
            renderMarkers();
        } else {
            console.log(`${loggingPrefix} Route sync: Event for day ${customEvent.detail.day} does not match current selectedDay ${selectedDay}. No marker update from this event.`);
        }
      }
    };

    window.addEventListener('routeRenderingComplete', handleRouteRenderingComplete);
    return () => {
      window.removeEventListener('routeRenderingComplete', handleRouteRenderingComplete);
    };
  }, [isMapInitialized, isNaverLoaded, clearAllMarkers, renderMarkers, selectedDay]); // Add selectedDay to ensure the check inside is current


  // Unmounting cleanup
  useEffect(() => {
    return () => {
      console.log(`${loggingPrefix} Component unmounting - clearing all markers.`);
      clearAllMarkers();
    };
  }, [clearAllMarkers]);

  return null; 
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  const loggingPrefix = '[MapMarkers.memo]';

  if (prevProps.isMapInitialized !== nextProps.isMapInitialized || prevProps.isNaverLoaded !== nextProps.isNaverLoaded) {
    console.log(`${loggingPrefix} Re-rendering due to map initialization state change.`);
    return false;
  }
  if (prevProps.selectedDay !== nextProps.selectedDay) {
    console.log(`${loggingPrefix} Re-rendering due to selectedDay change: ${prevProps.selectedDay} -> ${nextProps.selectedDay}`);
    return false;
  }
  if (prevProps.selectedPlace?.id !== nextProps.selectedPlace?.id) {
    console.log(`${loggingPrefix} Re-rendering due to selectedPlace change.`);
    return false;
  }
  if (prevProps.highlightPlaceId !== nextProps.highlightPlaceId) {
    console.log(`${loggingPrefix} Re-rendering due to highlightPlaceId change.`);
    return false;
  }

  // Compare places based on whether a day is selected or not
  if (nextProps.selectedDay !== null) {
    // Day is selected, compare places for that specific day from itinerary
    const prevDayPlaces = prevProps.itinerary?.find(d => d.day === prevProps.selectedDay)?.places;
    const nextDayPlaces = nextProps.itinerary?.find(d => d.day === nextProps.selectedDay)?.places;
    if (prevDayPlaces !== nextDayPlaces) { // Shallow comparison of place arrays
      console.log(`${loggingPrefix} Re-rendering due to itinerary day places change for day ${nextProps.selectedDay}.`);
      return false;
    }
  } else {
    // No day selected, compare general places
    if (prevProps.places !== nextProps.places) { // Renamed prop is allPlaces
      console.log(`${loggingPrefix} Re-rendering due to general places change.`);
      return false;
    }
  }
  
  // Compare full itinerary reference if it might affect context for useMarkerRenderLogic
  // (e.g., info window content for a place that's part of an itinerary but not currently selected day's place)
  // This might be too sensitive. If itinerary prop is only for selectedDay's places, this is simpler.
  // Based on current use, itinerary is passed for general context.
  if (prevProps.itinerary !== nextProps.itinerary && nextProps.selectedDay !== null) {
     // If itinerary reference changes AND a day is selected, it's safer to re-render
     // as the content for the selectedDay might have changed. This is partly covered above.
     // More specific: if the specific day object changed within the itinerary.
     const prevDayObj = prevProps.itinerary?.find(d => d.day === prevProps.selectedDay);
     const nextDayObj = nextProps.itinerary?.find(d => d.day === nextProps.selectedDay);
     if (prevDayObj !== nextDayObj) {
        console.log(`${loggingPrefix} Re-rendering due to itinerary day object change for day ${nextProps.selectedDay}.`);
        return false;
     }
  }


  if (prevProps.selectedPlaces !== nextProps.selectedPlaces) {
    console.log(`${loggingPrefix} Re-rendering due to selectedPlaces change.`);
    return false;
  }
  
  // showOnlyCurrentDayMarkers is effectively constant true, so comparison might not be needed
  // if (prevProps.showOnlyCurrentDayMarkers !== nextProps.showOnlyCurrentDayMarkers) return false;

  console.log(`${loggingPrefix} Skipping re-render.`);
  return true; // Props are considered the same
});

