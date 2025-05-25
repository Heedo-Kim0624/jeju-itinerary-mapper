import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useGeoJsonState as useAppGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import type { Place, ItineraryDay } from '@/types/supabase'; 
import type { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import { useCallback } from 'react';
import { useItinerary } from '@/hooks/use-itinerary';

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

  const { itinerary } = useItinerary();

  const features = useMapFeatures(map, isNaverLoaded, itinerary); 

  const { 
    clearMarkersAndUiElements, 
  } = features;

  const { 
    panTo 
  } = useMapNavigation(map);

  const appGeoJsonHookState = useAppGeoJsonState();
  const { showGeoJson, toggleGeoJsonVisibility, handleGeoJsonLoaded: appHandleGeoJsonLoaded } = appGeoJsonHookState;
  
  const setShowGeoJson = useCallback((show: boolean) => {
    if (appGeoJsonHookState.showGeoJson !== show) {
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
    calculateRoutes: calculateRoutesWrapper, 
    clearMarkersAndUiElements,
    panTo,
    showGeoJson: appGeoJsonHookState.showGeoJson,
    toggleGeoJsonVisibility: appGeoJsonHookState.toggleGeoJsonVisibility,
    isGeoJsonLoaded: appGeoJsonHookState.isGeoJsonLoaded,
    geoJsonNodes: appGeoJsonHookState.geoJsonNodes,
    geoJsonLinks: appGeoJsonHookState.geoJsonLinks,
    handleGeoJsonLoaded: appHandleGeoJsonLoaded, 
    checkGeoJsonMapping: appGeoJsonHookState.checkGeoJsonMapping,
    mapPlacesWithGeoNodes: features.mapPlacesWithGeoNodes,
    renderItineraryRoute: renderItineraryRouteWrapper, 
    clearAllRoutes: features.clearAllRoutes,
    highlightSegment: highlightSegmentWrapper, 
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex: showRouteForPlaceIndexWrapper, 
    renderGeoJsonRoute: renderGeoJsonRouteWrapper, 
    serverRoutesData: serverRoutesData as any, 
    setServerRoutes
  };
};

export default useMapCore;
