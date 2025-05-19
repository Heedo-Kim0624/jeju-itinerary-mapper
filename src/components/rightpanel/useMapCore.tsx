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
    // clearMarkersAndUiElements는 이제 clearAllMapElements로 변경됨
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
    allServerRoutesInput?: Record<number, ServerRouteResponse>, // 이 인자는 features.renderItineraryRoute에서 사용 안함
    onCompleteInput?: () => void
  ) => {
    // features.renderItineraryRoute는 ItineraryDay, (사용 안하는 allServerRoutes), onComplete를 받음
    features.renderItineraryRoute(
        itineraryDay,
        allServerRoutesInput, // features.renderItineraryRoute에서 이 인자를 무시하거나 선택적으로 사용
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
    // features.renderGeoJsonRoute가 features.renderItineraryRoute와 동일하게 동작하도록 수정됨
    features.renderGeoJsonRoute(itineraryDay, allServerRoutes, onComplete);
  };

  return {
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers: features.addMarkers, // 시그니처가 MapContextType과 일치하는지 확인
    calculateRoutes: calculateRoutesWrapper,
    clearAllMapElements: features.clearAllMapElements, // 변경된 함수명
    clearAllRoutes: features.clearAllRoutes, // 추가
    clearAllMarkers: features.clearAllMarkers, // 추가
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
    renderGeoJsonRoute: renderGeoJsonRouteWrapperInternal, // renderItineraryRoute와 유사하게
    serverRoutesData,
    setServerRoutes
  };
};

export default useMapCore;
