import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMarkerRenderLogic } from './hooks/marker-utils/useMarkerRenderLogic';
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
  // showOnlyCurrentDayMarkers is always true effectively, so it's removed from props
  // and logic is simplified in placesToRender
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places: allPlaces,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
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
  
  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`${loggingPrefix} Clearing ${markersRef.current.length} markers`);
      markersRef.current = clearMarkersUtil(markersRef.current); 
    }
  }, []); // markersRef is stable, no dependency needed.

  // Effect for rendering markers when relevant props change OR map becomes ready.
  useEffect(() => {
    if (isMapInitialized && isNaverLoaded) {
      console.log(`${loggingPrefix} Key props or map readiness changed. Rendering markers for ${placesToRender.length} places. Selected: ${selectedPlace?.id}, Highlight: ${highlightPlaceId}`);
      // This effect handles initial rendering and direct prop changes like selectedPlace or highlightPlaceId.
      // Day changes leading to placesToRender changes will also trigger this.
      // Synchronization with route rendering is handled by the 'routeRenderingComplete' event listener.
      clearAllMarkers();
      renderMarkers();
    }
  }, [
    placesToRender, 
    selectedPlace, 
    highlightPlaceId, 
    isMapInitialized, 
    isNaverLoaded,
    renderMarkers, // stable
    clearAllMarkers // stable
  ]);

  // Listen for route rendering completion to synchronize markers
  useEffect(() => {
    const handleRouteRenderingComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ day: number | null; status: string }>;
      console.log(`${loggingPrefix} Event 'routeRenderingComplete' received for day ${customEvent.detail.day}, status: ${customEvent.detail.status}. Current selectedDay: ${selectedDay}`);
      
      if (isMapInitialized && isNaverLoaded) {
        // Only update markers if the event corresponds to the currently selected day,
        // or if it's a global clear event (selectedDay is null and event.detail.day is null)
        if (customEvent.detail.day === selectedDay) {
            console.log(`${loggingPrefix} Route sync: Clearing and rendering markers for day ${selectedDay}.`);
            clearAllMarkers();
            renderMarkers(); // renderMarkers uses placesToRender, which is already filtered for selectedDay
        } else if (selectedDay === null && customEvent.detail.day === null && customEvent.detail.status === 'cleared') {
             console.log(`${loggingPrefix} Route sync: Global clear event. Clearing and rendering markers (likely general places).`);
            clearAllMarkers();
            renderMarkers();
        }
         else {
            console.log(`${loggingPrefix} Route sync: Event for day ${customEvent.detail.day} (status: ${customEvent.detail.status}) does not match current selectedDay ${selectedDay}. No marker update from this event.`);
        }
      }
    };

    window.addEventListener('routeRenderingComplete', handleRouteRenderingComplete);
    return () => {
      window.removeEventListener('routeRenderingComplete', handleRouteRenderingComplete);
    };
  }, [isMapInitialized, isNaverLoaded, clearAllMarkers, renderMarkers, selectedDay]); // selectedDay added


  // Unmounting cleanup
  useEffect(() => {
    return () => {
      console.log(`${loggingPrefix} Component unmounting - clearing all markers.`);
      clearAllMarkers();
    };
  }, [clearAllMarkers]); // stable

  return null; 
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  const loggingPrefix = '[MapMarkers.memo]';

  // isMapInitialized and isNaverLoaded are handled by context, not props, so no comparison here.
  // if (prevProps.isMapInitialized !== nextProps.isMapInitialized || prevProps.isNaverLoaded !== nextProps.isNaverLoaded) {
  //   console.log(`${loggingPrefix} Re-rendering due to map initialization state change.`);
  //   return false;
  // }

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
  // places prop is now allPlaces
  const prevPlacesToRender = prevProps.selectedDay !== null && prevProps.itinerary ? 
                           prevProps.itinerary.find(d => d.day === prevProps.selectedDay)?.places || [] : 
                           prevProps.places;
  const nextPlacesToRender = nextProps.selectedDay !== null && nextProps.itinerary ? 
                           nextProps.itinerary.find(d => d.day === nextProps.selectedDay)?.places || [] : 
                           nextProps.places;

  if (prevPlacesToRender !== nextPlacesToRender) {
      if (prevPlacesToRender.length !== nextPlacesToRender.length || 
          prevPlacesToRender.some((p, i) => p.id !== nextPlacesToRender[i]?.id)) {
          console.log(`${loggingPrefix} Re-rendering due to derived placesToRender change.`);
          return false;
      }
  }
  
  // Itinerary reference might change, but we are more interested if the specific day's data changed,
  // which is covered by comparing derived placesToRender.
  // A broad comparison of itinerary objects can be too sensitive if only other days changed.
  // If the actual object for the selectedDay within the itinerary array changes reference or content,
  // placesToRender comparison above should catch it.

  if (prevProps.selectedPlaces !== nextProps.selectedPlaces) {
    console.log(`${loggingPrefix} Re-rendering due to selectedPlaces change.`);
    return false;
  }
  
  console.log(`${loggingPrefix} Skipping re-render.`);
  return true; // Props are considered the same
});
