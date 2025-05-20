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
  
  const renderItineraryRouteWrapper = ( 
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteResponse>, 
    onCompleteInput?: () => void 
  ) => {
    // 수정: features.renderItineraryRoute 호출 시 모든 인자 전달
    features.renderItineraryRoute(
        itineraryDay,
        allServerRoutesInput ?? serverRoutesData, 
        onCompleteInput 
    );
  };

  const showRouteForPlaceIndexWrapper = ( 
    placeIndex: number, 
    itineraryDay: ItineraryDay,
    onComplete?: () => void 
  ) => {
    // 수정: features.showRouteForPlaceIndex 호출 시 모든 인자 전달
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
