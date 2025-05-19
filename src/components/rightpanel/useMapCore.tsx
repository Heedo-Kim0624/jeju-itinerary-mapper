
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
  
  // useMapFeatures now provides most of these functionalities
  const features = useMapFeatures(map); 

  const { 
    // addMarkers, // From features
    clearMarkersAndUiElements, // From features
    // calculateRoutes // From features (deprecated there)
  } = features; // useMapMarkers(map); // Potentially replaced by useMapFeatures for these

  const { 
    panTo 
  } = useMapNavigation(map); // Keep if specific navigation logic is separate

  // GeoJSON state is separate
  const {
    showGeoJson,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
    // mapPlacesWithGeoNodes // This is now in useMapFeatures
  } = useGeoJsonState();

  const {
    serverRoutesData,
    setServerRoutes: setServerRoutesBase // Renamed to avoid conflict
  } = useServerRoutes();

  // Wrapper for setServerRoutes to potentially include GeoJSON logic if needed from useGeoJsonState
  const setServerRoutes = (
    dayRoutes: Record<number, ServerRouteResponse> | 
               ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => {
    // The original implementation of setServerRoutes in useMapCore had:
    // setServerRoutesBase(dayRoutes, showGeoJson, toggleGeoJsonVisibility);
    // This seems incorrect as setServerRoutesBase from useServerRoutes only takes dayRoutes.
    // For now, just pass through. If showGeoJson interaction is needed, it has to be re-evaluated.
    if (typeof dayRoutes === 'function') {
        setServerRoutesBase(prev => dayRoutes(prev));
    } else {
        setServerRoutesBase(dayRoutes);
    }
  };
  
  // renderItineraryRoute correctly typed and calling the one from useMapFeatures
  const renderItineraryRoute = (
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteResponse>,
    onCompleteInput?: () => void
  ) => {
    // Correcting function call: Pass all three arguments to features.renderItineraryRoute
    features.renderItineraryRoute(
        itineraryDay,
        allServerRoutesInput ?? serverRoutesData,
        onCompleteInput
    );
  };

  // showRouteForPlaceIndex correctly typed and calling the one from useMapFeatures
  const showRouteForPlaceIndex = (
    placeIndex: number, 
    itineraryDay: ItineraryDay,
    onComplete?: () => void
  ) => {
    // Correcting function call: Pass all three arguments to features.showRouteForPlaceIndex
    features.showRouteForPlaceIndex(placeIndex, itineraryDay, onComplete);
  };

  return {
    // Map basic properties
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    
    // Features from useMapFeatures, selectively exposed or wrapped
    addMarkers: features.addMarkers,
    calculateRoutes: features.calculateRoutes, // Expose the (deprecated) one from useMapFeatures
    clearMarkersAndUiElements, // This was from features
    panTo, // From useMapNavigation
    
    // GeoJSON related (mostly from useGeoJsonState, mapPlacesWithGeoNodes from useMapFeatures)
    showGeoJson,
    toggleGeoJsonVisibility,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes: features.mapPlacesWithGeoNodes, // From useMapFeatures
    
    // Path rendering (from useMapFeatures)
    renderItineraryRoute, // Wrapped version
    clearAllRoutes: features.clearAllRoutes,
    highlightSegment: features.highlightSegment,
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex, // Wrapped version
    renderGeoJsonRoute: features.renderGeoJsonRoute,
    
    // Server routes data
    serverRoutesData,
    setServerRoutes // Wrapped version
  };
};

export default useMapCore;
