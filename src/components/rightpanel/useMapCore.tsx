
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
// import { useMapMarkers } from '@/hooks/map/useMapMarkers'; // Deprecated
// import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting'; // Older
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import { Place, ItineraryDay } from '@/types/supabase';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule'; // SegmentRoute 추가
import { useCallback } from 'react'; // useState, useEffect 제거, useCallback만 사용

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

  // GeoJsonState에서 필요한 값들 가져오기
  const geoJsonHookState = useGeoJsonState();
  const { showGeoJson, toggleGeoJsonVisibility } = geoJsonHookState; // setShowGeoJson 직접 가져오지 않음
  
  // setShowGeoJson 함수 생성 (useCallback 사용)
  const setShowGeoJson = useCallback((show: boolean) => {
    // showGeoJson 상태와 전달된 show 값이 다를 때만 toggleGeoJsonVisibility 호출
    if (geoJsonHookState.showGeoJson !== show) { // geoJsonHookState.showGeoJson 사용
      toggleGeoJsonVisibility();
    }
  }, [geoJsonHookState.showGeoJson, toggleGeoJsonVisibility]); // geoJsonHookState.showGeoJson 의존성 추가

  const {
    serverRoutesData,
    setServerRoutes: setServerRoutesBase
  } = useServerRoutes();

  // setServerRoutes 함수 수정 - 함수형 업데이트 처리
  const setServerRoutes = (
    dayRoutes: Record<number, ServerRouteResponse> | 
               ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => {
    if (typeof dayRoutes === 'function') {
        // 함수를 먼저 실행하여 결과 객체를 얻음
        const newRoutes = dayRoutes(serverRoutesData); 
        // 객체를 전달
        setServerRoutesBase(
          newRoutes,
          showGeoJson, 
          setShowGeoJson
        );
    } else {
        // 객체를 직접 전달
        setServerRoutesBase(
          dayRoutes,
          showGeoJson, 
          setShowGeoJson
        );
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
    showGeoJson: geoJsonHookState.showGeoJson, // Correctly expose showGeoJson from the hook state
    toggleGeoJsonVisibility: geoJsonHookState.toggleGeoJsonVisibility, // Correctly expose toggle
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
