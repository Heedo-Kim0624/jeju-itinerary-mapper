
import { useCallback } from 'react'; // useCallback 추가
import { useGeoJsonData } from './useGeoJsonData';
import { useGeoJsonRendering } from './useGeoJsonRendering';
import { useGeoJsonGlobalInterface } from './useGeoJsonGlobalInterface';
import type { RouteStyle } from './GeoJsonTypes'; // RouteStyle 임포트 추가

const useGeoJsonState = (
  map: naver.maps.Map | null,
  onGeoJsonRouteRenderComplete?: () => void // MapContext로부터 전달받을 콜백 (이름 명확화)
) => {
  const {
    isLoading,
    error,
    isLoaded,
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    getNodeById,
    getLinkById,
    getIsLoaded,
  } = useGeoJsonData();

  const {
    renderRoute: originalRenderRoute, // 이름 변경하여 명확화
    clearDisplayedFeatures,
  } = useGeoJsonRendering(
    map,
    isLoaded,
    getNodeById,
    getLinkById,
    onGeoJsonRouteRenderComplete // 콜백 전달
  );

  // useGeoJsonGlobalInterface에 전달할 어댑터 함수
  const renderRouteForGlobal = useCallback(
    (nodeIds: string[], linkIds: string[], style?: RouteStyle) => {
      // 전역 인터페이스는 'dayForLogging'을 모르므로 null 전달
      // originalRenderRoute는 style이 undefined일 경우 자체적으로 기본값을 사용함
      return originalRenderRoute(nodeIds, linkIds, null, style);
    },
    [originalRenderRoute]
  );

  useGeoJsonGlobalInterface(
    map,
    getIsLoaded,
    renderRouteForGlobal, // 어댑터 함수 전달
    clearDisplayedFeatures,
    getNodeById,
    getLinkById
  );

  return {
    isLoading,
    error,
    isLoaded,
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    clearDisplayedFeatures,
    getNodeById,
    getLinkById,
    renderRoute: originalRenderRoute, // 외부에서는 원래의 renderRoute를 사용하도록 반환
  };
};

export default useGeoJsonState;
