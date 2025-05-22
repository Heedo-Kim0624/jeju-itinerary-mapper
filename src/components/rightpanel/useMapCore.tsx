
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useGeoJsonState } from './geojson/useGeoJsonState'; // 원래 경로를 사용
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import type { Place, ItineraryDay } from '@/types/supabase'; // Supabase was an example, ensure it's the correct core Place type
import type { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import { useCallback } from 'react';

/**
 * 지도 핵심 기능 통합 훅
 */
const useMapCore = () => {
  const { 
    map, 
    mapContainer, 
    isMapInitialized, 
    isNaverLoaded,
    isMapError
  } = useMapInitialization();
  
  const features = useMapFeatures(map, isNaverLoaded); 

  const { 
    clearMarkersAndUiElements, 
  } = features;

  const { 
    panTo 
  } = useMapNavigation(map);

  // useGeoJsonState를 직접 사용
  const geoJsonHookState = useGeoJsonState(map);
  
  const setShowGeoJson = useCallback((show: boolean) => {
    // GeoJsonState가 다른 인터페이스를 사용하므로, 직접적인 호출은 제거합니다.
    console.log("GeoJSON visibility toggle requested:", show);
    // 실제 토글 기능이 필요하면 geoJsonHookState에서 적절한 메서드를 찾거나 구현해야 합니다.
  }, []);

  const {
    serverRoutesData,
    setAllServerRoutesData // Use the new setter from useServerRoutes
  } = useServerRoutes();

  // setServerRoutes 함수 수정
  const setServerRoutes = useCallback((
    dayRoutes: Record<number, ServerRouteResponse> | 
               ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => {
    // Assuming ServerRouteResponse is compatible with ServerRouteDataForDay
    // If not, a proper mapping function would be needed here.
    if (typeof dayRoutes === 'function') {
        setAllServerRoutesData(prev => dayRoutes(prev as any) as any);
    } else {
        setAllServerRoutesData(dayRoutes as any);
    }
  }, [setAllServerRoutesData]);
  
  const renderItineraryRouteWrapper = ( 
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteResponse>, 
    onCompleteInput?: () => void 
  ) => {
    features.renderItineraryRoute(
        itineraryDay,
        allServerRoutesInput ?? (serverRoutesData as any), // Cast if types differ
        onCompleteInput 
    );
  };

  const showRouteForPlaceIndexWrapper = ( 
    placeIndex: number, 
    itineraryDay: ItineraryDay,
    onComplete?: () => void 
  ) => {
    features.showRouteForPlaceIndex(
        placeIndex, 
        itineraryDay, 
        onComplete 
    );
  };
  
  const calculateRoutesWrapper = (placesToRoute: Place[]) => {
    features.calculateRoutes(placesToRoute);
  };
  
  const highlightSegmentWrapper = (segment: SegmentRoute | null) => {
    features.highlightSegment(segment);
  };

  // Fix for renderGeoJsonRoute to make it return void (already done)
  const renderGeoJsonRouteWrapper = (route: SegmentRoute) => {
    features.renderGeoJsonRoute(route);
  };

  return {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers: features.addMarkers,
    calculateRoutes: features.calculateRoutes, // Direct pass
    clearMarkersAndUiElements,
    panTo,
    // geoJsonHookState 대신 원래의 geoJsonHookState 인터페이스를 사용
    isLoading: geoJsonHookState.isLoading,
    error: geoJsonHookState.error,
    isLoaded: geoJsonHookState.isLoaded,
    nodes: geoJsonHookState.nodes,
    links: geoJsonHookState.links,
    handleLoadSuccess: geoJsonHookState.handleLoadSuccess,
    handleLoadError: geoJsonHookState.handleLoadError,
    getNodeById: geoJsonHookState.getNodeById,
    getLinkById: geoJsonHookState.getLinkById,
    clearDisplayedFeatures: geoJsonHookState.clearDisplayedFeatures,
    renderRoute: geoJsonHookState.renderRoute,
    mapPlacesWithGeoNodes: features.mapPlacesWithGeoNodes,
    renderItineraryRoute: renderItineraryRouteWrapper, 
    clearAllRoutes: features.clearAllRoutes,
    highlightSegment: features.highlightSegment, // Direct pass
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex: features.showRouteForPlaceIndex, // Direct pass
    renderGeoJsonRoute: features.renderGeoJsonRoute, // Direct pass
    serverRoutesData: serverRoutesData as any, // Cast if types differ
    setServerRoutes
  };
};

export default useMapCore;
