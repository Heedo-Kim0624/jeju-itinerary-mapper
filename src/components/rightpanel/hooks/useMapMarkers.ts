
import { useCallback, useEffect, useRef, useState } from 'react'; // Added useState
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
// import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup'; // Not used currently

import { useMarkerRefs } from './marker-utils/useMarkerRefs'; 
// import { useMarkerUpdater } from './marker-utils/useMarkerUpdater'; // Not used currently
// import { useMarkerEventListeners } from './marker-utils/useMarkerEventListeners'; 
// import { useMarkerRenderLogic } from './marker-utils/useMarkerRenderLogic'; 
// import { useMarkerLifecycleManager } from './marker-utils/useMarkerLifecycleManager'; 

import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { EventEmitter } from '@/hooks/events/useEventEmitter';

interface UseMapMarkersProps {
  places: Place[]; 
  selectedPlace: Place | null; 
  
  itinerary: ItineraryDay[] | null; 
  // selectedDay prop is removed

  selectedPlacesUi?: Place[]; 
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

export const useMapMarkers = (props: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const {
    itinerary, 
    onPlaceClick,
    highlightPlaceId,
    // places, // General places prop
    // selectedPlace, // General selectedPlace prop
    // selectedPlacesUi, // General selectedPlacesUi prop
  } = props;

  const { 
    selectedDay, 
    getDayRouteData, 
    setDayRouteData,
    // clearDayMarkers: clearDayMarkersFromStore // Not used currently
  } = useRouteMemoryStore();

  // const { markersRef: generalMarkersRef } = useMarkerRefs(); // For non-itinerary markers
  const [currentDayMarkers, setCurrentDayMarkers] = useState<any[]>([]);


  const clearAllCurrentDayMarkersFromMap = useCallback(() => {
    const dayData = getDayRouteData(selectedDay);
    if (dayData && dayData.markers) {
      dayData.markers.forEach(m => {
        if (m && typeof m.setMap === 'function') {
            m.setMap(null);
        }
      });
    }
    currentDayMarkers.forEach(m => {
        if (m && typeof m.setMap === 'function') {
            m.setMap(null);
        }
    });
    setCurrentDayMarkers([]);
  }, [selectedDay, getDayRouteData, currentDayMarkers]);


  const renderMarkersForSelectedDay = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !itinerary || selectedDay === null) {
      console.log('[useMapMarkers] Conditions not met for rendering day markers.');
      clearAllCurrentDayMarkersFromMap(); 
      return;
    }

    clearAllCurrentDayMarkersFromMap(); 

    const dayDataFromStore = getDayRouteData(selectedDay);
    let newMarkersForDay: any[] = [];

    if (dayDataFromStore && dayDataFromStore.markers && dayDataFromStore.markers.length > 0) {
      console.log(`[useMapMarkers] Reusing ${dayDataFromStore.markers.length} markers for day ${selectedDay} from store.`);
      newMarkersForDay = dayDataFromStore.markers.map(markerData => {
        // If markers in store are just data, recreate them. If they are NaverMarker instances, use them.
        // Assuming they are NaverMarker instances for now.
        if (markerData && typeof markerData.setMap === 'function') {
          markerData.setMap(map);
          return markerData;
        }
        // Fallback: if markerData is not a marker instance, this logic needs adjustment
        return null; 
      }).filter(m => m !== null) as any[];
      
    } else {
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
              // TODO: Add custom icon logic based on index, selection, highlight
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
        setDayRouteData(selectedDay, { markers: newMarkersForDay });
      } else {
         console.log(`[useMapMarkers] No places found in itinerary for day ${selectedDay}.`);
      }
    }
    setCurrentDayMarkers(newMarkersForDay);
    
    if (newMarkersForDay.length > 0 && window.naver && window.naver.maps) {
        const bounds = new window.naver.maps.LatLngBounds();
        newMarkersForDay.forEach(marker => {
            if (marker && typeof marker.getPosition === 'function') {
                bounds.extend(marker.getPosition());
            }
        });
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
        }
    }

  }, [map, isMapInitialized, isNaverLoaded, itinerary, selectedDay, getDayRouteData, setDayRouteData, onPlaceClick, highlightPlaceId, clearAllCurrentDayMarkersFromMap]);

  useEffect(() => {
    if (isMapInitialized) {
        console.log(`[useMapMarkers] Selected day changed to ${selectedDay} or map ready. Rendering day markers.`);
        renderMarkersForSelectedDay();
    }
  }, [selectedDay, isMapInitialized, renderMarkersForSelectedDay]);

  useEffect(() => {
    const handleMapDayChanged = (data: { day: number }) => {
      console.log(`[useMapMarkers] 'mapDayChanged' event received for day ${data.day}. Triggering re-render.`);
      if (isMapInitialized) {
        // selectedDay from store should already be updated by useMapDaySelector
        // This call ensures markers are re-rendered with the new store state.
        renderMarkersForSelectedDay();
      }
    };
    const unsubscribe = EventEmitter.subscribe('mapDayChanged', handleMapDayChanged);
    return () => unsubscribe();
  }, [isMapInitialized, renderMarkersForSelectedDay]);


  useEffect(() => {
    return () => {
      console.log("[useMapMarkers] Unmounting, clearing current day markers from map.");
      clearAllCurrentDayMarkersFromMap();
      // generalMarkersRef.current = clearMarkersUtil(generalMarkersRef.current);
    };
  }, [clearAllCurrentDayMarkersFromMap]);


  const forceMarkerUpdate = useCallback(() => {
    console.log("[useMapMarkers] forceMarkerUpdate called. Re-rendering markers for current day.");
    renderMarkersForSelectedDay();
  }, [renderMarkersForSelectedDay]);

  const clearAllMarkersAndStore = useCallback(() => {
     console.log("[useMapMarkers] Clearing all markers from map and store.");
     const store = useRouteMemoryStore.getState();
     store.routeDataByDay.forEach((dayData, dayIdx) => {
        if (dayData.markers) {
            dayData.markers.forEach(m => {
                if (m && typeof m.setMap === 'function') m.setMap(null);
            });
        }
        store.setDayRouteData(dayIdx, { markers: [] }); 
     });
     setCurrentDayMarkers([]);
  }, []);


  return {
    clearAllMarkers: clearAllMarkersAndStore, 
    forceMarkerUpdate, 
  };
};
