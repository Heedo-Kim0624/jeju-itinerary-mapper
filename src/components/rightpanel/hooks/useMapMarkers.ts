
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

  // Diagnostics log to verify hook execution
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
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId,
    map, 
    isMapInitialized,
    isNaverLoaded: !!window.naver?.maps,
    markersRef,
  });

  useMarkerLifecycleManager({
    selectedDay, itinerary, places, isMapInitialized, map,
    forceMarkerUpdate,
    prevSelectedDayRef, prevItineraryRef, prevPlacesRef,
  });

  // Add special diagnostic effect to log marker updates
  useEffect(() => {
    console.log(`[useMapMarkers] Update trigger changed: ${updateTriggerId}. Ready to render? ${isMapInitialized}`);
    
    if (updateTriggerId > 0 && isMapInitialized) {
      console.log(`[useMapMarkers] Main hook: Updating markers due to trigger ID change: ${updateTriggerId}`);
      renderMarkers();
    }
  }, [updateTriggerId, isMapInitialized, renderMarkers]);
  
  useEffect(() => {
    if (isMapInitialized && updateTriggerId === 0) { 
        console.log('[useMapMarkers] Initial mount render logic trigger.');
        forceMarkerUpdate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInitialized, map]);

  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate,
  };
};
