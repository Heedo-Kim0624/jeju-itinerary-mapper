import { useMemo, useCallback } from 'react';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { useMapMarkers } from './useMapMarkers';
import type { Place } from '@/types/supabase';
import type { GeoNode, GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';

// useMapFeaturesProps 인터페이스 정의하여 updateDayPolylinePaths 함수 타입 명시
interface UseMapFeaturesProps {
  map: any;
  isNaverLoadedParam: boolean;
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][]) => void;
}

export const useMapFeatures = ({ 
  map, 
  isNaverLoadedParam, 
  updateDayPolylinePaths // props로 받음
}: UseMapFeaturesProps) => {
  const geoJsonState = useGeoJsonState(); // app-level GeoJSON state

  const geoJsonNodeFeatures = useMemo((): GeoJsonNodeFeature[] => {
    if (!geoJsonState.geoJsonNodes || geoJsonState.geoJsonNodes.length === 0) {
      return [];
    }
    return geoJsonState.geoJsonNodes.map((node: GeoNode): GeoJsonNodeFeature => ({
      type: "Feature",
      geometry: node.geometry,
      properties: node.properties,
      id: node.id,
    }));
  }, [geoJsonState.geoJsonNodes]);

  const { mapPlacesWithGeoNodes } = usePlaceGeoJsonMapper({
    geoJsonNodes: geoJsonNodeFeatures, 
  });

  // useMapInteractionManager는 isNaverLoadedParam 대신 isNaverLoaded를 사용하도록 되어있을 수 있음. 확인 필요.
  // 여기서는 isNaverLoadedParam을 그대로 전달.
  const { addMarkers: addMarkersFromInteractionManager, showRouteForPlaceIndex } = useMapInteractionManager({
    map,
    isNaverLoadedParam, // 또는 isNaverLoaded
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
    geoJsonNodes: geoJsonNodeFeatures,
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
    updateDayPolylinePaths, // 전달받은 함수를 다시 전달
  });

  const { clearMarkersAndUiElements: clearAllMapMarkers } = useMapMarkers(map);

  const clearMarkersAndUiElements = useCallback(() => { // useCallback 추가
    console.log("[useMapFeatures] Clearing all markers and UI elements");
    if (clearAllMapMarkers) {
      clearAllMapMarkers();
    } else {
      console.warn("[useMapFeatures] clearAllMapMarkers function is not available");
    }
    clearAllDrawnRoutes();
  }, [clearAllMapMarkers, clearAllDrawnRoutes]);

  return {
    addMarkers: addMarkersFromInteractionManager, // useMapInteractionManager에서 온 addMarkers 사용
    clearMarkersAndUiElements,
    calculateRoutes: calculateAndDrawDirectRoutes,
    renderItineraryRoute,
    clearAllRoutes: clearAllDrawnRoutes, // clearAllDrawnRoutes를 clearAllRoutes로 반환
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    mapPlacesWithGeoNodes,
  };
};
