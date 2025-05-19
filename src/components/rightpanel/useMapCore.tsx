import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapMarkers } from '@/hooks/map/useMapMarkers'; // This hook might be deprecated or its functionality moved to useMapFeatures
// import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting'; // This seems to be an older routing mechanism
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures'; // Primary hook for features
import { Place, ItineraryDay } from '@/types/supabase';
import { ServerRouteResponse } from '@/types/schedule';

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
  
  const features = useMapFeatures(map); 

  const { 
    clearMarkersAndUiElements, 
  } = features;

  const { 
    panTo 
  } = useMapNavigation(map);

  const {
    showGeoJson,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
  } = useGeoJsonState();

  const {
    serverRoutesData,
    setServerRoutes: setServerRoutesBase
  } = useServerRoutes();

  const setServerRoutes = (
    dayRoutes: Record<number, ServerRouteResponse> | 
               ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => {
    if (typeof dayRoutes === 'function') {
        setServerRoutesBase(prev => dayRoutes(prev));
    } else {
        setServerRoutesBase(dayRoutes);
    }
  };
  
  const renderItineraryRoute = (
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteResponse>,
    onCompleteInput?: () => void
  ) => {
    features.renderItineraryRoute(
        itineraryDay,
        allServerRoutesInput ?? serverRoutesData,
        onCompleteInput
    );
  };

  const showRouteForPlaceIndex = (
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
    showGeoJson,
    toggleGeoJsonVisibility,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes: features.mapPlacesWithGeoNodes,
    renderItineraryRoute, 
    clearAllRoutes: features.clearAllRoutes,
    highlightSegment: features.highlightSegment,
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex, 
    renderGeoJsonRoute: features.renderGeoJsonRoute,
    serverRoutesData,
    setServerRoutes
  };
};

export default useMapCore;
