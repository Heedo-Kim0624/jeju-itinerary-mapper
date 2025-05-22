
// Corrected import path for useGeoJsonState
import useGeoJsonState from '@/components/rightpanel/geojson/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import type { Place } from '@/types/core'; // Ensure Place is from core

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean) => {
  // useGeoJsonState is now imported correctly without arguments
  const geoJsonState = useGeoJsonState(map);

  const { mapPlacesWithGeoNodes } = usePlaceGeoJsonMapper({
    geoJsonNodes: geoJsonState.nodes, // Now correctly accessed
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
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes,
  } = useRouteManager({
    map,
    isNaverLoadedParam,
    geoJsonLinks: geoJsonState.links, // Now correctly accessed
    geoJsonNodes: geoJsonState.nodes, // Now correctly accessed
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
  });

  const clearMarkersAndUiElements = clearAllDrawnRoutes;
  const clearAllRoutes = clearAllDrawnRoutes;

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
