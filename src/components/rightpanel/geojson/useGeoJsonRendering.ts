
import { useCallback, useRef } from 'react';
import type { GeoNode, GeoLink, RouteStyle, GeoCoordinates } from './GeoJsonTypes';

const defaultRouteStyle: RouteStyle = {
  strokeColor: '#2196F3',
  strokeWeight: 5,
  strokeOpacity: 0.8,
  fillColor: '#FF5722',
  fillOpacity: 1,
  zIndex: 100,
};

export const useGeoJsonRendering = (
  map: naver.maps.Map | null,
  isLoaded: boolean,
  getNodeById: (id: string) => GeoNode | undefined,
  getLinkById: (id: string) => GeoLink | undefined
) => {
  const activeMarkersRef = useRef<naver.maps.Marker[]>([]);
  const activePolylinesRef = useRef<naver.maps.Polyline[]>([]);

  const clearDisplayedFeatures = useCallback(() => {
    activeMarkersRef.current.forEach(marker => marker.setMap(null));
    activeMarkersRef.current = [];
    activePolylinesRef.current.forEach(polyline => polyline.setMap(null));
    activePolylinesRef.current = [];
    console.log('[useGeoJsonRendering] 모든 GeoJSON 경로 피처(마커, 폴리라인) 제거됨');
  }, []);

  const renderRoute = useCallback((nodeIds: string[], linkIds: string[], style: RouteStyle = defaultRouteStyle): (naver.maps.Marker | naver.maps.Polyline)[] => {
    if (!map || !isLoaded || !window.naver || !window.naver.maps) {
      console.warn('[useGeoJsonRendering] renderRoute: 지도 미초기화, GeoJSON 미로드, 또는 Naver API 미준비.');
      return [];
    }

    clearDisplayedFeatures();

    const newRenderedFeatures: (naver.maps.Marker | naver.maps.Polyline)[] = [];
    const newPolylines: naver.maps.Polyline[] = [];
    const newMarkers: naver.maps.Marker[] = [];

    linkIds.forEach(linkId => {
      const link = getLinkById(String(linkId));
      if (!link || !link.coordinates || !Array.isArray(link.coordinates) || link.coordinates.length < 2) {
        console.warn(`[useGeoJsonRendering] 링크 ID ${linkId}를 찾을 수 없거나 좌표가 유효하지 않습니다. Coordinates:`, link?.coordinates);
        return;
      }
      if (!window.naver || !window.naver.maps) return;

      try {
        const path = link.coordinates.map((coord: GeoCoordinates) =>
          new window.naver.maps.LatLng(coord[1], coord[0])
        );
        const polyline = new window.naver.maps.Polyline({
          map,
          path,
          strokeColor: style.strokeColor || defaultRouteStyle.strokeColor,
          strokeWeight: style.strokeWeight || defaultRouteStyle.strokeWeight,
          strokeOpacity: style.strokeOpacity || defaultRouteStyle.strokeOpacity,
          zIndex: style.zIndex || defaultRouteStyle.zIndex,
        });
        newPolylines.push(polyline);
        newRenderedFeatures.push(polyline);
      } catch (e) {
        console.error(`[useGeoJsonRendering] 링크 ${linkId} 렌더링 중 오류:`, e, link);
      }
    });

    nodeIds.forEach(nodeId => {
      const node = getNodeById(String(nodeId));
      if (!node || !node.coordinates || !Array.isArray(node.coordinates) || node.coordinates.length < 2) {
        console.warn(`[useGeoJsonRendering] 노드 ID ${nodeId}를 찾을 수 없거나 좌표가 유효하지 않습니다. Coordinates:`, node?.coordinates);
        return;
      }
      if (!window.naver || !window.naver.maps) return;

      try {
        const position = new window.naver.maps.LatLng(node.coordinates[1], node.coordinates[0]);
        const marker = new window.naver.maps.Marker({
          map,
          position,
          icon: {
            content: `<div style="width: 8px; height: 8px; background-color: ${style.fillColor || defaultRouteStyle.fillColor}; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 2px rgba(0,0,0,0.5);"></div>`,
            anchor: new window.naver.maps.Point(4, 4)
          },
          zIndex: (style.zIndex || defaultRouteStyle.zIndex || 100) + 1
        });
        newMarkers.push(marker);
        newRenderedFeatures.push(marker);
      } catch (e) {
        console.error(`[useGeoJsonRendering] 노드 ${nodeId} 렌더링 중 오류:`, e, node);
      }
    });

    activePolylinesRef.current = newPolylines;
    activeMarkersRef.current = newMarkers;
    console.log(`[useGeoJsonRendering] 경로 렌더링 완료: ${newPolylines.length} 링크, ${newMarkers.length} 노드`);
    return newRenderedFeatures;
  }, [map, isLoaded, clearDisplayedFeatures, getLinkById, getNodeById]);

  return {
    renderRoute,
    clearDisplayedFeatures,
    // activeMarkersRef and activePolylinesRef are internal to this hook
  };
};
