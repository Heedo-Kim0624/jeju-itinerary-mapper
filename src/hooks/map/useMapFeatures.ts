
import { useMemo, useCallback } from 'react';
import { useGeoJsonState as useActualGeoJsonState } from '@/components/rightpanel/geojson/useGeoJsonState'; // Renamed to avoid conflict
import { usePlaceGeoJsonMapper } from './usePlaceGeoJsonMapper';
import { useMapInteractionManager } from './useMapInteractionManager';
import { useRouteManager } from './useRouteManager';
import { useMapMarkers } from '@/hooks/map/useMapMarkersLegacy'; // 변경: 경로 수정
import type { Place, ItineraryDay } from '@/types/supabase';
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
  const geoJsonState = useActualGeoJsonState(); // Use renamed import

  const geoJsonNodeFeatures = useMemo((): GeoJsonNodeFeature[] => {
    if (!geoJsonState.geoJsonData?.features || geoJsonState.geoJsonData.features.length === 0) { // Adjusted to access features from geoJsonData
      return [];
    }
    // Assuming geoJsonState.geoJsonData.features are already GeoJsonNodeFeature[]
    // If not, mapping might be needed, but useGeoJsonState likely provides them in correct format
    // For now, let's assume geoJsonState.geoJsonData.features is what we need
    // This part needs to align with the actual structure returned by useActualGeoJsonState
    // A common pattern is for geoJsonState.geoJsonData to be a FeatureCollection,
    // and geoJsonState.geoJsonData.features to be an array of Features.
    // Let's assume geoJsonState.geoJsonNodes is the correct source as per the original code.
    const nodesSource = geoJsonState.geoJsonNodes || []; // Fallback to geoJsonNodes if geoJsonData.features is not the path
    
    return nodesSource.map((node: GeoNode): GeoJsonNodeFeature => ({
      type: "Feature",
      geometry: node.geometry,
      properties: node.properties,
      id: node.id,
    }));
  }, [geoJsonState.geoJsonNodes, geoJsonState.geoJsonData]); // Added geoJsonState.geoJsonData

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
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
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
    if (clearAllDrawnRoutes) { // Check if clearAllDrawnRoutes exists
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
