import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapNavigation } from '@/hooks/map/useMapNavigation';
import { useMapMarkers } from '@/hooks/map/useMapMarkers';
import { useMapItineraryRouting } from '@/hooks/map/useMapItineraryRouting';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { useMapFeatures } from '@/hooks/map/useMapFeatures';
import { Place } from '@/types/supabase';
import { ServerRouteResponse } from '@/types/schedule';

/**
 * 지도 핵심 기능 통합 훅
 */
const useMapCore = () => {
  // 지도 초기화 및 상태 관리
  const { 
    map, 
    mapContainer, 
    isMapInitialized, 
    isNaverLoaded,
    isMapError
  } = useMapInitialization();
  
  // 지도 마커 관리
  const { 
    addMarkers, 
    clearMarkersAndUiElements,
    calculateRoutes
  } = useMapMarkers(map);
  
  // 지도 네비게이션 기능
  const { 
    panTo 
  } = useMapNavigation(map);
  
  // 경로 렌더링 기능
  const {
    renderDayRoute,
    renderMultiDayRoutes, 
    clearAllRoutes,
    highlightSegment
  } = useMapItineraryRouting(map);

  // GeoJSON 상태 관리
  const {
    showGeoJson,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded,
    checkGeoJsonMapping
  } = useGeoJsonState();

  // 서버 경로 데이터 관리
  const {
    serverRoutesData,
    setServerRoutes: setServerRoutesBase
  } = useServerRoutes();

  // 지도 특성(마커, 경로 등) 관리
  const {
    renderGeoJsonRoute,
    renderItineraryRoute: renderItineraryRouteBase,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex: showRouteForPlaceIndexBase
  } = useMapFeatures(map);

  // 서버 경로 데이터 설정 함수
  const setServerRoutes = (dayRoutes: Record<number, ServerRouteResponse>) => {
    setServerRoutesBase(dayRoutes, showGeoJson, toggleGeoJsonVisibility);
  };

  // 일정 경로 렌더링 함수
  const renderItineraryRoute = (itineraryDay: any) => {
    renderItineraryRouteBase(itineraryDay, serverRoutesData, renderDayRoute, clearAllRoutes);
  };

  // 특정 장소 인덱스의 경로 하이라이트
  const showRouteForPlaceIndex = (placeIndex: number, itineraryDay: any) => {
    showRouteForPlaceIndexBase(placeIndex, itineraryDay, serverRoutesData);
  };

  // 간단화된 mapPlacesWithGeoNodes 함수
  const mapPlacesWithGeoNodes = (places: Place[]) => places;

  return {
    // 지도 기본 속성
    map,
    mapContainer,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    
    // 지도 마커 및 네비게이션
    addMarkers,
    calculateRoutes,
    clearMarkersAndUiElements,
    panTo,
    
    // GeoJSON 관련
    showGeoJson,
    toggleGeoJsonVisibility,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
    
    // 경로 렌더링
    renderItineraryRoute,
    clearAllRoutes,
    highlightSegment,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    renderGeoJsonRoute,
    
    // 장소-노드 매핑
    mapPlacesWithGeoNodes,
    
    // 서버 경로
    serverRoutesData,
    setServerRoutes
  };
};

export default useMapCore;
