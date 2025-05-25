import { useMemo } from 'react';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { useMapMarkers } from './useMapMarkers';
import type { Place } from '@/types/supabase';
// GeoJsonNodeFeature 타입을 import합니다.
import type { GeoNode, GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean) => {
  const geoJsonState = useGeoJsonState();

  // GeoNode[]를 GeoJsonNodeFeature[]로 변환합니다.
  const geoJsonNodeFeatures = useMemo((): GeoJsonNodeFeature[] => {
    if (!geoJsonState.geoJsonNodes || geoJsonState.geoJsonNodes.length === 0) {
      return [];
    }
    // GeoNode를 GeoJsonNodeFeature로 변환할 때, properties와 geometry 타입이 호환되어야 합니다.
    // GeoNode.properties는 GeoJsonNodeProperties와 호환되며,
    // GeoNode.geometry는 GeoJsonGeometry와 호환됩니다.
    return geoJsonState.geoJsonNodes.map((node: GeoNode): GeoJsonNodeFeature => ({
      type: "Feature",
      geometry: node.geometry, // GeoNode의 geometry는 GeoJsonGeometry 타입이므로 직접 할당 가능
      properties: node.properties, // GeoNode의 properties는 GeoJsonNodeProperties 타입이므로 직접 할당 가능
      id: node.id,
    }));
  }, [geoJsonState.geoJsonNodes]);

  const { mapPlacesWithGeoNodes } = usePlaceGeoJsonMapper({
    // usePlaceGeoJsonMapper는 GeoJsonNodeFeature[]를 기대하도록 수정될 것입니다.
    geoJsonNodes: geoJsonNodeFeatures, 
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
    geoJsonNodes: geoJsonNodeFeatures, // 변환된 GeoJsonNodeFeature[]를 전달합니다.
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
  });

  // Use the marker management from useMapMarkers hook
  const { clearMarkersAndUiElements: clearAllMapMarkers } = useMapMarkers(map);

  // Create a comprehensive function that clears both markers and routes
  const clearMarkersAndUiElements = () => {
    console.log("[useMapFeatures] Clearing all markers and UI elements");
    if (clearAllMapMarkers) {
      clearAllMapMarkers();
    } else {
      console.warn("[useMapFeatures] clearAllMapMarkers function is not available");
    }
    clearAllDrawnRoutes();
  };

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
