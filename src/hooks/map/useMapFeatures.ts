import { useMemo, useCallback } from 'react';
import useActualGeoJsonState from '@/components/rightpanel/geojson/useGeoJsonState'; // 변경: default import로 수정
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { useMapMarkers } from '@/hooks/map/useMapMarkersLegacy';
import type { Place, ItineraryDay } from '@/types/core'; // types/supabase에서 core로 변경
import type { GeoNode, GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';

// useMapFeaturesProps 인터페이스 정의하여 updateDayPolylinePaths 함수 타입 명시
interface UseMapFeaturesProps {
  map: any;
  isNaverLoadedParam: boolean;
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => void;
}

export const useMapFeatures = ({ 
  map, 
  isNaverLoadedParam, 
  updateDayPolylinePaths 
}: UseMapFeaturesProps) => {
  const geoJsonState = useActualGeoJsonState(map); // map 인스턴스 전달

  const geoJsonNodeFeatures = useMemo((): GeoJsonNodeFeature[] => {
    // 기존 geoJsonState.geoJsonNodes는 GeoNode[] 타입이므로 이를 GeoJsonNodeFeature[]로 변환
    // useActualGeoJsonState에서 반환하는 nodes가 GeoNode[] 타입이라고 가정
    const nodesSource = geoJsonState.nodes || []; 
    
    return nodesSource.map((node: GeoNode): GeoJsonNodeFeature => ({
      type: "Feature",
      geometry: node.geometry,
      properties: node.properties,
      id: node.id,
    }));
  }, [geoJsonState.nodes]); // geoJsonState.nodes로 변경

  const { mapPlacesWithGeoNodes } = usePlaceGeoJsonMapper({
    geoJsonNodes: geoJsonNodeFeatures, 
  });

  // useMapInteractionManager는 isNaverLoadedParam 대신 isNaverLoaded를 사용하도록 되어있을 수 있음. 확인 필요.
  // 여기서는 isNaverLoadedParam을 그대로 전달.
  const { addMarkers: addMarkersFromInteractionManager, showRouteForPlaceIndex } = useMapInteractionManager({
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
    geoJsonNodes: geoJsonNodeFeatures,
    // mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes, // 이 prop 제거
    updateDayPolylinePaths, 
  });

  const { clearMarkersAndUiElements: clearAllMapMarkers } = useMapMarkers(map);

  const clearMarkersAndUiElements = useCallback(() => { 
    console.log("[useMapFeatures] Clearing all markers and UI elements");
    if (clearAllMapMarkers) {
      clearAllMapMarkers();
    } else {
      console.warn("[useMapFeatures] clearAllMapMarkers function is not available");
    }
    if (clearAllDrawnRoutes) { 
        clearAllDrawnRoutes();
    } else {
        console.warn("[useMapFeatures] clearAllDrawnRoutes function is not available");
    }
  }, [clearAllMapMarkers, clearAllDrawnRoutes]);

  return {
    addMarkers: addMarkersFromInteractionManager, 
    clearMarkersAndUiElements,
    calculateRoutes: calculateAndDrawDirectRoutes,
    renderItineraryRoute,
    clearAllRoutes: clearAllDrawnRoutes, 
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    mapPlacesWithGeoNodes,
  };
};
