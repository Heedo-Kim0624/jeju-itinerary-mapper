
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import type { Place } from '@/types/supabase'; // Ensure Place is imported if used in return types or parameters not covered by sub-hooks

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean) => {
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
    clearAllDrawnRoutes, // This is the new comprehensive clear function for routes
    calculateAndDrawDirectRoutes,
  } = useRouteManager({
    map,
    isNaverLoadedParam,
    geoJsonLinks: geoJsonState.geoJsonLinks,
    geoJsonNodes: geoJsonState.geoJsonNodes,
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
  });

  // The original clearMarkersAndUiElements was an alias for clearAllRoutes.
  // We'll use clearAllDrawnRoutes from useRouteManager for this.
  // If marker clearing is needed separately, addMarkers would need to return
  // a clear function or manage markers internally for clearing.
  // For now, aligning with the original behavior where clearMarkersAndUiElements cleared routes.
  const clearMarkersAndUiElements = clearAllDrawnRoutes;
  const clearAllRoutes = clearAllDrawnRoutes; // Alias for consistency if used elsewhere

  return {
    addMarkers,
    clearMarkersAndUiElements,
    calculateRoutes: calculateAndDrawDirectRoutes, // Map to the new function name
    renderItineraryRoute,
    clearAllRoutes, // Expose the comprehensive clear function
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    mapPlacesWithGeoNodes,
  };
};
