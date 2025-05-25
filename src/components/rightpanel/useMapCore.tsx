
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { loadNaverMaps } from '@/utils/loadNaverMaps';
import { initializeNaverMap } from '@/utils/map/mapInitializer'; // createNaverLatLng 제거
import { createNaverLatLng } from '@/utils/map/mapSetup'; // createNaverLatLng 여기서 임포트
import { panToPosition, fitBoundsToPlaces } from '@/utils/map/mapViewControls';
import { useMapResize } from '@/hooks/useMapResize';
// useGeoJsonLayer 제거
import useGeoJsonStateHook from '@/components/rightpanel/geojson/useGeoJsonState'; // useGeoJsonState 임포트
import { useMapMarkers as useMapMarkersLegacyHook } from '@/hooks/map/useMapMarkersLegacy';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import type { GeoNode, GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes'; // 타입 임포트 추가
import { SegmentRoute } from '@/types/schedule';
import { useServerRoutes, ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import { usePlaceGeoJsonMapper } from '@/hooks/map/usePlaceGeoJsonMapper';
import { useRouteManager } from '@/hooks/map/useRouteManager'; // useRouteManager 임포트 추가

const MAP_ID = 'map';

const useMapCore = () => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isNaverLoaded, setIsNaverLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isMapError, setIsMapError] = useState(false);

  // GeoJSON 상태 관리 로직 변경
  const geoJsonState = useGeoJsonStateHook(mapRef.current);
  const [showGeoJsonLocal, setShowGeoJsonLocal] = useState(true); // 로컬 상태로 GeoJSON 표시 여부 관리

  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJsonLocal(prev => !prev);
  }, []);

  const handleGeoJsonLoadedCallback = useCallback((nodes: GeoNode[], links: any[]) => {
    if (geoJsonState.handleLoadSuccess) {
      geoJsonState.handleLoadSuccess(nodes, links);
    }
    console.log('[useMapCore] GeoJSON data loaded and processed via callback.');
  }, [geoJsonState.handleLoadSuccess]);

  // GeoNode[]를 GeoJsonNodeFeature[]로 변환
  const geoJsonNodeFeatures = useMemo((): GeoJsonNodeFeature[] => {
    if (!geoJsonState.nodes || geoJsonState.nodes.length === 0) {
      return [];
    }
    return geoJsonState.nodes.map((node: GeoNode): GeoJsonNodeFeature => ({
      type: "Feature",
      geometry: node.geometry,
      properties: node.properties,
      id: node.id,
    }));
  }, [geoJsonState.nodes]);

  const {
    mapPlacesWithGeoNodes,
  } = usePlaceGeoJsonMapper({ geoJsonNodes: geoJsonNodeFeatures });

  // checkGeoJsonMapping 스텁 함수
  const checkGeoJsonMapping = useCallback((places: Place[]): {
    totalPlaces: number;
    mappedPlaces: number;
    mappingRate: string;
    averageDistance: number | string;
    success: boolean;
    message: string;
  } => {
    const mappedPlaceObjects = mapPlacesWithGeoNodes(places);
    const successfullyMappedPlaces = mappedPlaceObjects.filter(p => p.geoJsonNodeId != null);
    const total = places.length;
    const mappedCount = successfullyMappedPlaces.length;
    const rate = total > 0 ? ((mappedCount / total) * 100).toFixed(1) + '%' : '0%';
    
    console.log(`[useMapCore] checkGeoJsonMapping: Total ${total}, Mapped ${mappedCount} (${rate})`);
    return {
      totalPlaces: total,
      mappedPlaces: mappedCount,
      mappingRate: rate,
      averageDistance: 'N/A', // 실제 거리 계산 로직 필요
      success: mappedCount > 0,
      message: mappedCount > 0 ? `${mappedCount}개 장소가 GeoJSON 노드와 매핑되었습니다.` : '매핑된 장소가 없습니다. GeoJSON 데이터를 확인하세요.',
    };
  }, [mapPlacesWithGeoNodes]);

  const {
    addMarkers: addMarkersFromHook,
    clearMarkersAndUiElements: clearMarkersAndUiElementsFromHook,
    calculateRoutes: calculateRoutesFromHook,
  } = useMapMarkersLegacyHook(mapRef.current);

  const { 
    serverRoutesData, 
    setAllServerRoutesData,
    updateDayPolylinePaths,
  } = useServerRoutes();

  const {
    renderItineraryRoute,
    renderGeoJsonRoute,
    highlightSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    // calculateAndDrawDirectRoutes, // 이 함수는 useRouteManager에서 drawDirectPath로 이름이 변경되었을 수 있음. 확인 필요
  } = useRouteManager({
    map: mapRef.current,
    isNaverLoadedParam: isNaverLoaded,
    geoJsonNodes: geoJsonNodeFeatures, // 변환된 geoJsonNodeFeatures 사용
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
    updateDayPolylinePaths: updateDayPolylinePaths,
  });
  
  useEffect(() => {
    const init = async () => {
      try {
        await loadNaverMaps();
        setIsNaverLoaded(true);
        if (mapContainerRef.current && !mapRef.current) {
          const naver = window.naver;
          if (naver && naver.maps) {
            const mapInstance = initializeNaverMap(mapContainerRef.current);
            mapRef.current = mapInstance;
            setIsMapInitialized(true);
            console.log('[useMapCore] Naver Map initialized and configured.');
          } else {
            throw new Error("Naver Maps API not fully loaded.");
          }
        }
      } catch (error) {
        console.error('Failed to load Naver Maps:', error);
        setIsMapError(true);
      }
    };
    init();

    return () => {
      // Cleanup if necessary, though map instance might be managed elsewhere or not need explicit destroy
    };
  }, []);

  useMapResize(mapRef.current, mapContainerRef.current, [isMapInitialized]);

  const panTo = useCallback((locationOrCoords: string | {lat: number, lng: number}) => {
    if (mapRef.current && isMapInitialized && isNaverLoaded) {
      if (typeof locationOrCoords === 'string') {
        console.warn("panTo with string address not implemented, requires geocoding.");
      } else {
        panToPosition(mapRef.current, locationOrCoords.lat, locationOrCoords.lng);
      }
    }
  }, [isMapInitialized, isNaverLoaded]);

  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => {
    if (!mapRef.current || !itineraryDay || !itineraryDay.routeData || !itineraryDay.routeData.segmentRoutes) {
      console.warn("[useMapCore] Map not ready or missing route data for showRouteForPlaceIndex.");
      if (onComplete) onComplete();
      return;
    }
    
    const segment = itineraryDay.routeData.segmentRoutes.find(
      seg => seg.fromIndex === placeIndex || seg.toIndex === placeIndex + 1 
    );

    if (segment) {
      console.log(`[useMapCore] Highlighting segment for place index ${placeIndex}:`, segment);
      highlightSegment(segment); 
    } else {
      console.log(`[useMapCore] No specific segment found for place index ${placeIndex}, clearing previous highlight.`);
      clearPreviousHighlightedPath(); 
    }
    if (onComplete) onComplete();
  }, [highlightSegment, clearPreviousHighlightedPath, isMapInitialized]);

  if (process.env.NODE_ENV === 'development' && mapRef.current) {
    // console.log("[useMapCore] Hook Values:", {
    //   isMapInitialized, isNaverLoaded, isGeoJsonLoaded,
    //   geoJsonNodesCount: geoJsonNodes?.length,
    //   geoJsonLinksCount: geoJsonLinks?.length,
    //   hasRenderItineraryRoute: typeof renderItineraryRoute === 'function',
    //   hasHighlightSegment: typeof highlightSegment === 'function',
    //   serverRoutesDataKeys: Object.keys(serverRoutesData || {}),
    //   updateDayPolylinePathsProvided: typeof updateDayPolylinePaths === 'function',
    // });
  }
  
  return {
    map: mapRef.current,
    mapContainer: mapContainerRef,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers: addMarkersFromHook,
    calculateRoutes: calculateRoutesFromHook, // useMapMarkersLegacyHook에서 제공
    clearMarkersAndUiElements: clearMarkersAndUiElementsFromHook,
    panTo,
    showGeoJson: showGeoJsonLocal, // 로컬 상태 사용
    toggleGeoJsonVisibility, // 새로 정의된 함수 사용
    renderItineraryRoute,
    clearAllRoutes: clearAllDrawnRoutes, 
    handleGeoJsonLoaded: handleGeoJsonLoadedCallback, // 새로 정의된 콜백 사용
    highlightSegment, 
    clearPreviousHighlightedPath, 
    isGeoJsonLoaded: geoJsonState.isLoaded, // geoJsonState 사용
    checkGeoJsonMapping, // 스텁 함수 또는 실제 구현된 함수
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex,
    renderGeoJsonRoute, 
    geoJsonNodes: geoJsonState.nodes, // geoJsonState 사용
    geoJsonLinks: geoJsonState.links, // geoJsonState 사용
    serverRoutesData,
    setServerRoutes: setAllServerRoutesData,
    updateDayPolylinePaths,
  };
};

export default useMapCore;
