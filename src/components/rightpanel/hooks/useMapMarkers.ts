import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

import { useMarkerRefs } from './marker-utils/useMarkerRefs'; // Keep if general marker refs are still useful
import { useMarkerUpdater } from './marker-utils/useMarkerUpdater';
// import { useMarkerEventListeners } from './marker-utils/useMarkerEventListeners'; // May need adjustment
import { useMarkerRenderLogic } from './marker-utils/useMarkerRenderLogic'; // This will be heavily adapted
// import { useMarkerLifecycleManager } from './marker-utils/useMarkerLifecycleManager'; // May need adjustment

import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { EventEmitter } from '@/hooks/events/useEventEmitter';

interface UseMapMarkersProps {
  // These props might still be relevant for general place display, outside of itinerary context
  places: Place[]; // General places, e.g. from search results
  selectedPlace: Place | null; // A single selected place, not necessarily from itinerary
  
  // Itinerary related props - these will now be mainly driven by the store for the *selected day*
  itinerary: ItineraryDay[] | null; // Full itinerary data, needed to get place details for a day
  // selectedDay: number | null; // This prop will now be taken from useRouteMemoryStore

  selectedPlaces?: Place[]; // Places selected in UI, e.g. for cart (might be different from itinerary)
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

export const useMapMarkers = (props: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const {
    itinerary, // Full itinerary is needed to find details for places of the selected day
    onPlaceClick,
    highlightPlaceId,
    // `places`, `selectedPlace`, `selectedPlacesUi` might be for non-itinerary markers
  } = props;

  // Zustand store for day-specific data
  const { 
    selectedDay, // This is obtained from the store
    getDayRouteData, 
    setDayRouteData,
    clearDayMarkers: clearDayMarkersFromStore 
  } = useRouteMemoryStore();

  const { markersRef: generalMarkersRef } = useMarkerRefs(); // For non-itinerary markers
  const [currentDayMarkers, setCurrentDayMarkers] = useState<any[]>([]);


  const clearAllCurrentDayMarkersFromMap = useCallback(() => {
    // Clear markers associated with the *currently selected day* from the map
    const dayData = getDayRouteData(selectedDay);
    if (dayData && dayData.markers) {
      dayData.markers.forEach(m => m.setMap(null));
    }
    // Also clear any locally tracked currentDayMarkers if they haven't made it to store yet
    currentDayMarkers.forEach(m => m.setMap(null));
    setCurrentDayMarkers([]);
  }, [selectedDay, getDayRouteData, currentDayMarkers]);


  // This is the core marker rendering logic for the selected itinerary day
  const renderMarkersForSelectedDay = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !itinerary || selectedDay === null) {
      console.log('[useMapMarkers] Conditions not met for rendering day markers.');
      clearAllCurrentDayMarkersFromMap(); // Clear if conditions are not met
      return;
    }

    clearAllCurrentDayMarkersFromMap(); // Clear previous markers for the day

    const dayDataFromStore = getDayRouteData(selectedDay);
    let newMarkersForDay: any[] = [];

    // Check if markers are already created and stored for this day
    if (dayDataFromStore && dayDataFromStore.markers && dayDataFromStore.markers.length > 0) {
      console.log(`[useMapMarkers] Reusing ${dayDataFromStore.markers.length} markers for day ${selectedDay} from store.`);
      newMarkersForDay = dayDataFromStore.markers;
      newMarkersForDay.forEach(marker => marker.setMap(map)); // Add them back to map
    } else {
      // Markers not in store, create them
      const currentItineraryDay = itinerary.find(d => d.day === selectedDay);
      if (currentItineraryDay && currentItineraryDay.places) {
        console.log(`[useMapMarkers] Creating ${currentItineraryDay.places.length} new markers for day ${selectedDay}.`);
        currentItineraryDay.places.forEach((place: ItineraryPlaceWithTime, index: number) => {
          if (place.y != null && place.x != null && window.naver && window.naver.maps) {
            const position = new window.naver.maps.LatLng(place.y, place.x);
            const markerOptions: any = {
              position,
              map,
              title: place.name,
            };
            const marker = new window.naver.maps.Marker(markerOptions);

            if (onPlaceClick) {
              window.naver.maps.Event.addListener(marker, 'click', () => {
                onPlaceClick(place, index);
              });
            }
            newMarkersForDay.push(marker);
          }
        });
        // Store newly created markers
        setDayRouteData(selectedDay, { markers: newMarkersForDay });
      } else {
         console.log(`[useMapMarkers] No places found in itinerary for day ${selectedDay}.`);
      }
    }
    setCurrentDayMarkers(newMarkersForDay);
    
    // Fit bounds to new markers if any
    if (newMarkersForDay.length > 0 && window.naver && window.naver.maps) {
        const bounds = new window.naver.maps.LatLngBounds();
        newMarkersForDay.forEach(marker => bounds.extend(marker.getPosition()));
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
        }
    }

  }, [map, isMapInitialized, isNaverLoaded, itinerary, selectedDay, getDayRouteData, setDayRouteData, onPlaceClick, highlightPlaceId, clearAllCurrentDayMarkersFromMap]);

  // Effect to re-render markers when selectedDay (from store) changes or map is ready
  useEffect(() => {
    if (isMapInitialized) {
        console.log(`[useMapMarkers] Selected day changed to ${selectedDay} or map ready. Rendering day markers.`);
        renderMarkersForSelectedDay();
    }
  }, [selectedDay, isMapInitialized, renderMarkersForSelectedDay]);

  // Event listener for explicit 'mapDayChanged' events
  useEffect(() => {
    const handleMapDayChanged = (data: { day: number }) => {
      console.log(`[useMapMarkers] 'mapDayChanged' event received for day ${data.day}. Triggering re-render.`);
      // The selectedDay from store should already be updated by useMapDaySelector.
      // This effect primarily ensures renderMarkersForSelectedDay is called if map is initialized.
      if (isMapInitialized) {
        renderMarkersForSelectedDay();
      }
    };
    const unsubscribe = EventEmitter.subscribe('mapDayChanged', handleMapDayChanged);
    return () => unsubscribe();
  }, [isMapInitialized, renderMarkersForSelectedDay]);


  // Clear all markers on component unmount or when map is destroyed
  useEffect(() => {
    return () => {
      console.log("[useMapMarkers] Unmounting, clearing current day markers from map.");
      clearAllCurrentDayMarkersFromMap();
      // If generalMarkersRef is used for non-itinerary markers, clear them too if needed
      // generalMarkersRef.current = clearMarkersUtil(generalMarkersRef.current);
    };
  }, [clearAllCurrentDayMarkersFromMap]);


  // The `forceMarkerUpdate` and `clearAllMarkers` might need to be re-evaluated.
  // `clearAllMarkers` should perhaps clear data from the store for all days.
  const forceMarkerUpdate = useCallback(() => {
    console.log("[useMapMarkers] forceMarkerUpdate called. Re-rendering markers for current day.");
    renderMarkersForSelectedDay();
  }, [renderMarkersForSelectedDay]);

  const clearAllMarkersAndStore = useCallback(() => {
     console.log("[useMapMarkers] Clearing all markers from map and store.");
     const store = useRouteMemoryStore.getState();
     store.routeDataByDay.forEach((_dayData, dayIdx) => { // Iterate using dayIdx from map keys or a range
        const dayRouteD = store.getDayRouteData(dayIdx); // Get specific day data
        if (dayRouteD && dayRouteD.markers) {
          dayRouteD.markers.forEach(m => m.setMap(null));
        }
        store.setDayRouteData(dayIdx, { markers: [] }); // Clear from store
     });
     setCurrentDayMarkers([]);
  }, []);

  return {
    // markers: currentDayMarkers, // markers for the currently selected day
    clearAllMarkers: clearAllMarkersAndStore, // Clears all markers from store and map
    forceMarkerUpdate, // Triggers re-render for current day
  };
};
