
import { useEffect, useCallback } from 'react';
import type { GeoJsonLayerRef, GeoNode, GeoLink, RouteStyle } from './GeoJsonTypes';

export const useGeoJsonGlobalInterface = (
  map: naver.maps.Map | null,
  isLoadedGetter: () => boolean,
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => (naver.maps.Marker | naver.maps.Polyline)[],
  clearDisplayedFeatures: () => void,
  getNodeById: (id: string) => GeoNode | undefined,
  getLinkById: (id: string) => GeoLink | undefined
) => {
  const registerGlobalInterface = useCallback(() => {
    if (typeof window !== 'undefined' && window.naver && window.naver.maps) {
      const layerInterface: GeoJsonLayerRef = {
        renderRoute,
        clearDisplayedFeatures,
        getNodeById,
        getLinkById,
        isLoaded: isLoadedGetter,
      };
      (window as any).geoJsonLayer = layerInterface;

      return () => {
        // Call clearDisplayedFeatures from the hook itself to ensure it uses its own context
        clearDisplayedFeatures(); 
        if ((window as any).geoJsonLayer === layerInterface) {
          delete (window as any).geoJsonLayer;
          console.log('[useGeoJsonGlobalInterface] geoJsonLayer 전역 인터페이스 제거됨');
        }
      };
    }
    return () => {};
  }, [renderRoute, clearDisplayedFeatures, getNodeById, getLinkById, isLoadedGetter]);

  useEffect(() => {
    if (map && window.naver && window.naver.maps) {
      console.log('[useGeoJsonGlobalInterface] geoJsonLayer 전역 인터페이스 등록 시도 중...');
      const cleanupGlobalInterface = registerGlobalInterface();
      return () => {
        cleanupGlobalInterface();
      };
    }
  }, [map, registerGlobalInterface]);
};
