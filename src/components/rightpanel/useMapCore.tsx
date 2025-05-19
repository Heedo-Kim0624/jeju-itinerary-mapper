
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
  
  // highlightSegment의 타입이 (segment: SegmentRoute | null) => void 이므로,
  // useMapCore에서 그대로 전달하면 됩니다.
  // MapContextType에서 이 타입을 맞춰줘야 합니다.
  const highlightSegmentWrapper = (segment: SegmentRoute | null) => {
    features.highlightSegment(segment);
  };

  // Fix for renderGeoJsonRoute to make it return void
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
    highlightSegment: highlightSegmentWrapper, 
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex, 
    renderGeoJsonRoute: renderGeoJsonRouteWrapper,
    serverRoutesData,
    setServerRoutes
  };
};

export default useMapCore;
