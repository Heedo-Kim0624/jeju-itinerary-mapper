
import { useCallback, useEffect } from 'react';
import { useMapContext } from '../../MapContext';
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
  const { map, isMapInitialized } = useMapContext();
  const {
    places, selectedPlace, itinerary, selectedDay,
    selectedPlaces = [], onPlaceClick, highlightPlaceId,
  } = props;

  const {
    markersRef, prevSelectedDayRef, prevItineraryRef,
    prevPlacesRef, updateRequestIdRef,
  } = useMarkerRefs();

  const { updateTriggerId, forceMarkerUpdate } = useMarkerUpdater({ updateRequestIdRef });

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
    markersRef,
  });

  useMarkerLifecycleManager({
    selectedDay, itinerary, places, isMapInitialized, map,
    forceMarkerUpdate,
    prevSelectedDayRef, prevItineraryRef, prevPlacesRef,
  });

  useEffect(() => {
    if (updateTriggerId > 0 && isMapInitialized) {
      console.log(`[useMapMarkers] Main hook: Updating markers due to trigger ID change: ${updateTriggerId}`);
      renderMarkers();
    }
  }, [updateTriggerId, isMapInitialized, renderMarkers]);
  
  // Initial render on mount if map is already initialized
  // This covers cases where component mounts after map is ready
  useEffect(() => {
    if (isMapInitialized && updateTriggerId === 0) { // Only if no update has been triggered yet
        console.log('[useMapMarkers] Initial mount render logic trigger.');
        forceMarkerUpdate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInitialized, map]); // updateTriggerId is intentionally omitted to run once on init if needed

  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate,
  };
};
