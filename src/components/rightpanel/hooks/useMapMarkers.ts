
import { useCallback, useEffect } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

import { useMarkerRefs } from './marker-utils/useMarkerRefs';
import { useMarkerUpdater } from './marker-utils/useMarkerUpdater';
import { useMarkerEventListeners } from './marker-utils/useMarkerEventListeners';
import { useMarkerRenderLogic } from './marker-utils/useMarkerRenderLogic';
import { useMarkerLifecycleManager } from './marker-utils/useMarkerLifecycleManager';

interface UseMapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

export const useMapMarkers = (props: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const {
    places, selectedPlace, itinerary, selectedDay,
    selectedPlaces = [], onPlaceClick, highlightPlaceId,
  } = props;

  const {
    markersRef, prevSelectedDayRef, prevItineraryRef,
    prevPlacesRef, updateRequestIdRef,
  } = useMarkerRefs();

  const { updateTriggerId, forceMarkerUpdate } = useMarkerUpdater({ updateRequestIdRef });

  console.log(`[useMapMarkers] Hook execution - selectedDay: ${selectedDay}, triggerId: ${updateTriggerId}, markers count: ${markersRef.current.length}`);

  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`[useMapMarkers] Clearing all existing markers: ${markersRef.current.length}`);
      markersRef.current = clearMarkersUtil(markersRef.current);
    }
  }, [markersRef]);

  useMarkerEventListeners({
    clearAllMarkers,
    forceMarkerUpdate,
    prevSelectedDayRef,
  });

  const { renderMarkers } = useMarkerRenderLogic({
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay,
    selectedPlaces,
    onPlaceClick, 
    highlightPlaceId,
    map, 
    isMapInitialized,
    isNaverLoaded: !!window.naver?.maps,
    markersRef,
  });

  useMarkerLifecycleManager({
    selectedDay, 
    itinerary, 
    places, 
    isMapInitialized, 
    map,
    forceMarkerUpdate,
    prevSelectedDayRef, 
    prevItineraryRef, 
    prevPlacesRef,
  });

  // Main effect to handle marker updates - simplified and more direct
  useEffect(() => {
    if (isMapInitialized && map && window.naver?.maps) {
      console.log(`[useMapMarkers] Triggering marker render for day ${selectedDay}`);
      renderMarkers();
    }
  }, [selectedDay, isMapInitialized, map, renderMarkers]);

  // Handle day selection events from the schedule viewer
  useEffect(() => {
    const handleItineraryDaySelectedEvent = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[useMapMarkers] Day selection event received - Day: ${event.detail.day}`);
        // Clear and re-render markers immediately
        clearAllMarkers();
        setTimeout(() => {
          renderMarkers();
        }, 100);
      }
    };
    
    window.addEventListener('itineraryDaySelected', handleItineraryDaySelectedEvent);
    
    return () => {
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelectedEvent);
    };
  }, [clearAllMarkers, renderMarkers]);

  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate,
  };
};
