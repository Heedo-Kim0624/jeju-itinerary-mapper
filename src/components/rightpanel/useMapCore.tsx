
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
// import { useMapMarkers } from '@/hooks/map/useMapMarkers'; // Deprecated
// import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting'; // Older
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import { Place, ItineraryDay } from '@/types/supabase';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule'; // SegmentRoute 추가

/**
 * 지도 핵심 기능 통합 훅
 */
const useMapCore = () => {
  const { 
    map, 
    mapContainer, 
    isMapInitialized, 
    isNaverLoaded, // isNaverLoaded를 여기서 가져옴
    isMapError
  } = useMapInitialization();
  
  // useMapFeatures에 isNaverLoaded 전달
  const features = useMapFeatures(map, isNaverLoaded); 

  const { 
    clearMarkersAndUiElements, 
  } = features;

  const { 
    panTo 
  } = useMapNavigation(map);

  const geoJsonHookState = useGeoJsonState(); // Renamed to avoid conflict with direct geoJsonState usage

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
  
  const renderItineraryRouteWrapper = ( // Renamed to avoid conflict with features.renderItineraryRoute
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteResponse>, // Added parameter based on user guide
    onCompleteInput?: () => void // Added parameter based on user guide
  ) => {
    features.renderItineraryRoute(
        itineraryDay,
        allServerRoutesInput ?? serverRoutesData, // Pass all required args
        onCompleteInput // Pass all required args
    );
  };

  const showRouteForPlaceIndexWrapper = ( // Renamed
    placeIndex: number, 
    itineraryDay: ItineraryDay,
    onComplete?: () => void // Added parameter based on user guide
  ) => {
    features.showRouteForPlaceIndex(
        placeIndex, 
        itineraryDay, 
        onComplete // Pass all required args
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
    calculateRoutes: calculateRoutesWrapper,
    clearMarkersAndUiElements,
    panTo,
    showGeoJson: geoJsonHookState.showGeoJson,
    toggleGeoJsonVisibility: geoJsonHookState.toggleGeoJsonVisibility,
    isGeoJsonLoaded: geoJsonHookState.isGeoJsonLoaded,
    geoJsonNodes: geoJsonHookState.geoJsonNodes,
    geoJsonLinks: geoJsonHookState.geoJsonLinks,
    handleGeoJsonLoaded: geoJsonHookState.handleGeoJsonLoaded,
    checkGeoJsonMapping: geoJsonHookState.checkGeoJsonMapping,
    mapPlacesWithGeoNodes: features.mapPlacesWithGeoNodes,
    renderItineraryRoute: renderItineraryRouteWrapper, 
    clearAllRoutes: features.clearAllRoutes,
    highlightSegment: highlightSegmentWrapper, 
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex: showRouteForPlaceIndexWrapper, 
    renderGeoJsonRoute: renderGeoJsonRouteWrapper,
    serverRoutesData,
    setServerRoutes
  };
};

export default useMapCore;
