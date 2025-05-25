
import { useMemo } from 'react'; // useMemo import 추가
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { useMapMarkers } from './useMapMarkers';
import type { Place } from '@/types/supabase';
// GeoJson 관련 타입들을 import 합니다. 경로가 정확한지 확인해주세요.
// GeoJsonTypes.ts가 src/components/rightpanel/geojson/GeoJsonTypes.ts 에 위치한다고 가정
import type { GeoNode, GeoJsonFeature, Point, GeoJsonNodeProperties } from '@/components/rightpanel/geojson/GeoJsonTypes';

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean) => {
  const geoJsonState = useGeoJsonState(); // 이제 geoJsonState.geoJsonNodes는 GeoNode[] 타입입니다.

  // GeoNode[]를 GeoJsonFeature<Point, GeoJsonNodeProperties>[]로 변환합니다.
  const geoJsonFeaturesForRouteManager = useMemo((): GeoJsonFeature<Point, GeoJsonNodeProperties>[] => {
    if (!geoJsonState.geoJsonNodes || geoJsonState.geoJsonNodes.length === 0) {
      return [];
    }
    return geoJsonState.geoJsonNodes.map((node: GeoNode) => ({
      type: "Feature",
      geometry: node.geometry as Point, // GeoNode의 geometry가 Point 타입이라고 가정합니다.
      properties: node.properties as GeoJsonNodeProperties, // GeoNode의 properties를 사용합니다.
      id: node.id, // GeoNode의 id를 Feature의 id로 사용합니다.
    }));
  }, [geoJsonState.geoJsonNodes]);

  const { mapPlacesWithGeoNodes } = usePlaceGeoJsonMapper({
    // usePlaceGeoJsonMapper가 GeoNode[]를 기대한다고 가정하고 기존의 geoJsonNodes를 전달합니다.
    // 만약 GeoJsonFeature[]를 기대한다면 geoJsonFeaturesForRouteManager를 전달해야 합니다.
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
    geoJsonNodes: geoJsonFeaturesForRouteManager, // 변환된 GeoJsonFeature[]를 전달합니다.
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
