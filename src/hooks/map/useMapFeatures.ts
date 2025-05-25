import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { useMapMarkers } from './useMapMarkers';
import type { Place } from '@/types/supabase';

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
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes,
  } = useRouteManager({
    map,
    isNaverLoadedParam,
    geoJsonNodes: geoJsonState.geoJsonNodes,
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
  });

  // Use the marker management from useMapMarkers hook
  const { clearMarkersAndUiElements: clearAllMapMarkers } = useMapMarkers(map);

  // Create a comprehensive function that clears both markers and routes
  const clearMarkersAndUiElements = () => {
    console.log("[useMapFeatures] Clearing all markers and UI elements");
    // First clear all markers
    if (clearAllMapMarkers) {
      clearAllMapMarkers();
    } else {
      console.warn("[useMapFeatures] clearAllMapMarkers function is not available");
    }
    
    // Then clear all routes
    clearAllDrawnRoutes();
  };

  const clearAllRoutes = clearAllDrawnRoutes; // Keep this alias for backward compatibility

  return {
    addMarkers,
    clearMarkersAndUiElements, // This now properly clears both markers and routes
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
