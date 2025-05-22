import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import useAppGeoJsonState from '@/hooks/map/useGeoJsonState'; // Corrected: use default import
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import type { Place, ItineraryDay, SelectedPlace } from '@/types/core'; // Updated to use core types
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

  const appGeoJsonHookState = useAppGeoJsonState(); 
  const { 
    showGeoJson, 
    toggleGeoJsonVisibility, 
    handleGeoJsonLoaded: appHandleGeoJsonLoaded,
    isGeoJsonLoaded, // Add this
    geoJsonNodes,   // Add this
    geoJsonLinks,    // Add this
    checkGeoJsonMapping // Add this
  } = appGeoJsonHookState;
  
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
  
  const calculateRoutesWrapper = (placesToRoute: Place[]) => { // Ensure Place[] type if that's what calculateRoutes expects
    const placesWithStringIds = placesToRoute.map(p => ({ ...p, id: String(p.id) }));
    features.calculateRoutes(placesWithStringIds);
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
    showGeoJson, // Pass through from appGeoJsonHookState
    toggleGeoJsonVisibility, // Pass through
    isGeoJsonLoaded, // Pass through
    geoJsonNodes, // Pass through
    geoJsonLinks, // Pass through
    handleGeoJsonLoaded: appHandleGeoJsonLoaded,
    checkGeoJsonMapping, // Pass through
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
