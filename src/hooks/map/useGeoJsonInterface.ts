
import { useCallback } from 'react';
import { GeoNode, GeoLink, RouteStyle, GeoJsonLayerRef } from '@/components/rightpanel/geojson/GeoJsonTypes';

/**
 * GeoJSON 전역 인터페이스 관리 훅
 */
export const useGeoJsonInterface = (
  map: any,
  nodes: GeoNode[],
  links: GeoLink[],
  getNodeById: (id: string) => GeoNode | undefined,
  getLinkById: (id: string) => GeoLink | undefined,
  renderRoute: (nodeIds: string[], linkIds: string[], nodes: GeoNode[], links: GeoLink[], style?: RouteStyle) => any[],
  renderAllNetwork: (nodes: GeoNode[], links: GeoLink[]) => any[],
  clearDisplayedFeatures: () => void
) => {
  // 경로 렌더링 글로벌 함수 구현
  const renderRouteGlobal = useCallback((nodeIds: string[], linkIds: string[], style?: RouteStyle) => {
    return renderRoute(nodeIds, linkIds, nodes, links, style);
  }, [renderRoute, nodes, links]);
  
  // 전체 네트워크 렌더링 글로벌 함수 구현
  const renderAllNetworkGlobal = useCallback(() => {
    return renderAllNetwork(nodes, links);
  }, [renderAllNetwork, nodes, links]);

  // 전역 인터페이스 등록
  const registerGlobalInterface = useCallback(() => {
    // 전역에 GeoJSON 레이어 인터페이스 제공
    const layerInterface: GeoJsonLayerRef = {
      renderRoute: renderRouteGlobal,
      clearDisplayedFeatures,
      getNodeById,
      getLinkById,
      renderAllNetwork: renderAllNetworkGlobal
    };
    
    window.geoJsonLayer = layerInterface;
    
    // 클리어 함수 반환 (컴포넌트 언마운트 시 호출됨)
    return () => {
      clearDisplayedFeatures();
      if (window.geoJsonLayer === layerInterface) {
        delete window.geoJsonLayer;
      }
    };
  }, [
    renderRouteGlobal,
    clearDisplayedFeatures,
    getNodeById,
    getLinkById,
    renderAllNetworkGlobal
  ]);
  
  return { registerGlobalInterface };
};
