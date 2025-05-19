
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import { Place, ItineraryDay } from '@/types/supabase';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule';

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
  
  // useMapFeatures에 isNaverLoaded 전달
  const features = useMapFeatures(map, isNaverLoaded); 

  const { 
    clearAllMapElements, 
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

  // renderItineraryRoute는 MapContextType의 시그니처와 일치해야 함
  const renderItineraryRouteWrapper = (
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteResponse>,
    onCompleteInput?: () => void
  ) => {
    // features.renderItineraryRoute 호출 시 모든 인자 전달
    features.renderItineraryRoute(
        itineraryDay,
        allServerRoutesInput,
        onCompleteInput
    );
  };

  // showRouteForPlaceIndex wrapper - 시그니처 일치 확인
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
  
  // calculateRoutesWrapper - 이 함수는 재검토 필요
  const calculateRoutesWrapper = (placesToRoute: Place[]) => {
    features.calculateRoutes(placesToRoute);
  };
  
  // highlightSegmentWrapper
  const highlightSegmentWrapper = (segment: SegmentRoute | null) => {
    features.highlightSegment(segment);
  };

  // renderGeoJsonRouteWrapper는 renderItineraryRouteWrapper와 유사하게 동작
  const renderGeoJsonRouteWrapperInternal = (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteResponse>,
    onComplete?: () => void
  ) => {
    // features.renderGeoJsonRoute 호출 시 모든 인자 전달
    features.renderGeoJsonRoute(itineraryDay, allServerRoutes, onComplete);
  };

  return {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers: features.addMarkers,
    calculateRoutes: calculateRoutesWrapper,
    clearAllMapElements: features.clearAllMapElements,
    clearAllRoutes: features.clearAllRoutes,
    clearAllMarkers: features.clearAllMarkers,
    panTo,
    showGeoJson,
    toggleGeoJsonVisibility,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes: features.mapPlacesWithGeoNodes,
    renderItineraryRoute: renderItineraryRouteWrapper, 
    highlightSegment: highlightSegmentWrapper, 
    clearPreviousHighlightedPath: features.clearPreviousHighlightedPath,
    showRouteForPlaceIndex: showRouteForPlaceIndexWrapper, 
    renderGeoJsonRoute: renderGeoJsonRouteWrapperInternal,
    serverRoutesData,
    setServerRoutes
  };
};

export default useMapCore;
