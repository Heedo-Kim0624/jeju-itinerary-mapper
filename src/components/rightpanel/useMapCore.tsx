import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useGeoJsonState as useAppGeoJsonState } from '@/hooks/map/useGeoJsonState'; // Renamed to avoid conflict
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

  const appGeoJsonHookState = useAppGeoJsonState(); // Use renamed hook
  const { showGeoJson, toggleGeoJsonVisibility, handleGeoJsonLoaded: appHandleGeoJsonLoaded } = appGeoJsonHookState;
  
  const setShowGeoJson = useCallback((show: boolean) => {
    if (appGeoJsonHookState.showGeoJson !== show) {
      toggleGeoJsonVisibility();
    }
  }, [appGeoJsonHookState.showGeoJson, toggleGeoJsonVisibility]);

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
    // Logic to show GeoJSON if routes are set (example)
    // if (Object.keys(dayRoutes).length > 0 && !showGeoJson) {
    //   setShowGeoJson(true);
    // }
  }, [setAllServerRoutesData /*, showGeoJson, setShowGeoJson */ ]); // Dependencies updated
  
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
    showGeoJson: appGeoJsonHookState.showGeoJson,
    toggleGeoJsonVisibility: appGeoJsonHookState.toggleGeoJsonVisibility,
    isGeoJsonLoaded: appGeoJsonHookState.isGeoJsonLoaded,
    geoJsonNodes: appGeoJsonHookState.geoJsonNodes,
    geoJsonLinks: appGeoJsonHookState.geoJsonLinks,
    handleGeoJsonLoaded: appHandleGeoJsonLoaded, // Pass through the app-level GeoJSON loaded handler
    checkGeoJsonMapping: appGeoJsonHookState.checkGeoJsonMapping,
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
