import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { eventEmitter } from '@/utils/eventEmitter';
import type { Place, ItineraryDay } from '@/types/supabase';

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean, itinerary: ItineraryDay[] | null) => {
  const geoJsonState = useGeoJsonState();

  const { mapPlacesWithGeoNodes } = usePlaceGeoJsonMapper({
    geoJsonNodes: geoJsonState.geoJsonNodes,
  });

  const { addMarkers, showRouteForPlaceIndex } = useMapInteractionManager({
    map,
    isNaverLoadedParam,
  });

  const {
    renderItineraryRoute,
    renderGeoJsonRoute,
    highlightSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes: routeManagerClearRoutes,
    calculateAndDrawDirectRoutes,
  } = useRouteManager({
    map,
    isNaverLoadedParam,
    geoJsonLinks: geoJsonState.geoJsonLinks,
    geoJsonNodes: geoJsonState.geoJsonNodes,
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
    itinerary,
  });

  const clearMarkersAndUiElements = () => {
    console.log("[useMapFeatures] Emitting clearAllMapElements event to clear markers and routes.");
    eventEmitter.emit('clearAllMapElements');
  };

  const clearAllRoutes = () => {
    console.log("[useMapFeatures] Clearing all routes (delegating to routeManager or event).");
    routeManagerClearRoutes();
  };

  return {
    addMarkers,
    clearMarkersAndUiElements,
    calculateRoutes: calculateAndDrawDirectRoutes,
    renderItineraryRoute,
    clearAllRoutes,
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    mapPlacesWithGeoNodes,
  };
};
