
import { useMemo } from 'react';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { useMapMarkers } from './useMapMarkers';
import type { Place } from '@/types/supabase';
// Point import 제거, GeoJsonFeature는 제네릭 없이 사용
import type { GeoNode, GeoJsonFeature, GeoJsonNodeProperties } from '@/components/rightpanel/geojson/GeoJsonTypes';

export const useMapFeatures = (map: any, isNaverLoadedParam: boolean) => {
  const geoJsonState = useGeoJsonState();

  // GeoNode[]를 GeoJsonFeature[]로 변환합니다.
  const geoJsonFeaturesForRouteManager = useMemo((): GeoJsonFeature[] => {
    if (!geoJsonState.geoJsonNodes || geoJsonState.geoJsonNodes.length === 0) {
      return [];
    }
    return geoJsonState.geoJsonNodes.map((node: GeoNode) => ({
      type: "Feature",
      geometry: node.geometry, // Point 캐스팅 제거, node.geometry는 GeoJsonGeometry 타입
      properties: node.properties as GeoJsonNodeProperties,
      id: node.id,
    }));
  }, [geoJsonState.geoJsonNodes]);

  const { mapPlacesWithGeoNodes } = usePlaceGeoJsonMapper({
    // usePlaceGeoJsonMapper는 GeoJsonFeature[]를 기대하도록 수정되었거나, 내부적으로 GeoNode를 처리해야 합니다.
    // 현재 usePlaceGeoJsonMapper는 GeoJsonFeature[]를 받으므로, geoJsonFeaturesForRouteManager를 전달하는 것이 맞습니다.
    // 하지만 원본 코드에서는 geoJsonNodes: geoJsonState.geoJsonNodes 였으므로,
    // usePlaceGeoJsonMapper가 GeoNode[]를 기대한다면 해당 훅의 props 타입을 확인해야 합니다.
    // 여기서는 geoJsonState.geoJsonNodes를 그대로 사용하고, usePlaceGeoJsonMapper가 GeoNode[]를 처리한다고 가정합니다.
    // 만약 usePlaceGeoJsonMapper가 GeoJsonFeature[]를 처리해야 한다면, 이 부분을 geoJsonFeaturesForRouteManager로 변경해야 합니다.
    // 이전 커밋에서 usePlaceGeoJsonMapper의 geoJsonNodes props는 GeoJsonFeature[]로 변경되었었음.
    // 따라서 geoJsonFeaturesForRouteManager를 전달하는 것이 맞음.
    geoJsonNodes: geoJsonFeaturesForRouteManager, 
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
