
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useGeoJsonState as useAppGeoJsonState } from '@/hooks/map/useGeoJsonState'; // Named import
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import type { Place, ItineraryDay } from '@/types/core'; 
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

  // Destructure geoJsonNodes and geoJsonLinks before calling useMapFeatures
  const appGeoJsonHookState = useAppGeoJsonState();
  const { 
    showGeoJson, 
    toggleGeoJsonVisibility, 
    handleGeoJsonLoaded: appHandleGeoJsonLoaded,
    geoJsonNodes: हानिकारकGeoJsonNodesFromState, // Renamed to avoid conflict with features if any
    geoJsonLinks: हानिकारकGeoJsonLinksFromState,   // Renamed to avoid conflict
    isGeoJsonLoaded,
    checkGeoJsonMapping
  } = appGeoJsonHookState;
  
  // useMapFeatures now gets geoJson internally via its own useGeoJsonState
  const features = useMapFeatures(map, isNaverLoaded); 

  const { 
    clearMarkersAndUiElements, 
  } = features;

  const { 
    panTo 
  } = useMapNavigation(map);
  
  const setShowGeoJson = useCallback((show: boolean) => {
    if (appGeoJsonHookState.showGeoJson !== show) { // Use the state from appGeoJsonHookState
      toggleGeoJsonVisibility();
    }
  }, [appGeoJsonHookState.showGeoJson, toggleGeoJsonVisibility]);

  const {
    serverRoutesData,
    setAllServerRoutesData
  } = useServerRoutes();

  const setServerRoutes = useCallback((
    dayRoutes: Record<number, ServerRouteResponse> | 
               ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => {
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
        allServerRoutesInput ?? (serverRoutesData as any),
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
    calculateRoutes: features.calculateRoutes, // Corrected: calculateRoutes is calculateAndDrawDirectRoutes in features
    clearMarkersAndUiElements,
    panTo,
    showGeoJson, 
    toggleGeoJsonVisibility, 
    isGeoJsonLoaded, 
    geoJsonNodes: हानिकारकGeoJsonNodesFromState, // Use the ones from appGeoJsonHookState
    geoJsonLinks: हानिकारकGeoJsonLinksFromState,   // Use the ones from appGeoJsonHookState
    handleGeoJsonLoaded: appHandleGeoJsonLoaded,
    checkGeoJsonMapping, 
    mapPlacesWithGeoNodes: features.mapPlacesWithGeoNodes,
    renderItineraryRoute: renderItineraryRouteWrapper, 
    clearAllRoutes: features.clearAllRoutes,
    highlightSegment: features.highlightSegment,
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex: features.showRouteForPlaceIndex,
    renderGeoJsonRoute: features.renderGeoJsonRoute,
    serverRoutesData: serverRoutesData as any,
    setServerRoutes
  };
};

export default useMapCore;
