
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
  getLinkById: (id: string) => GeoLink | undefined,
  onRenderingComplete?: () => void // Make callback optional, to be provided by MapContext/useMapCore
) => {
  const activeMarkersRef = useRef<naver.maps.Marker[]>([]);
  const activePolylinesRef = useRef<naver.maps.Polyline[]>([]);

  const clearDisplayedFeatures = useCallback(() => {
    // console.log('[useGeoJsonRendering] Clearing all GeoJSON features');
    activeMarkersRef.current.forEach(marker => marker.setMap(null));
    activeMarkersRef.current = [];
    activePolylinesRef.current.forEach(polyline => polyline.setMap(null));
    activePolylinesRef.current = [];
    // console.log('[useGeoJsonRendering] All GeoJSON route features (markers, polylines) removed.');
  }, []);

  const renderRoute = useCallback((
    nodeIds: string[], 
    linkIds: string[], 
    dayForLogging: number | null, // 일자 정보 (로깅용)
    style: RouteStyle = defaultRouteStyle
  ): (naver.maps.Marker | naver.maps.Polyline)[] => {
    const loggingPrefix = `[GeoJsonRendering Day ${dayForLogging ?? 'N/A'}]`;

    if (!map || !isLoaded || !window.naver || !window.naver.maps) {
      console.warn(`${loggingPrefix} renderRoute: Map not initialized, GeoJSON not loaded, or Naver API not ready.`);
      if (onRenderingComplete) onRenderingComplete(); // Still call complete if skipping
      return [];
    }

    console.log(`${loggingPrefix} Rendering route. Links: ${linkIds.length}, Nodes: ${nodeIds.length}`);
    
    clearDisplayedFeatures();

    const newRenderedFeatures: (naver.maps.Marker | naver.maps.Polyline)[] = [];
    const newPolylines: naver.maps.Polyline[] = [];
    const newMarkers: naver.maps.Marker[] = [];
    let missingLinkCount = 0;
    let missingNodeCount = 0;

    linkIds.forEach(linkId => {
      const link = getLinkById(String(linkId));
      if (!link || !link.coordinates || !Array.isArray(link.coordinates) || link.coordinates.length < 2) {
        // console.warn(`${loggingPrefix} Link ID ${linkId} not found or coordinates invalid.`);
        missingLinkCount++;
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
        console.error(`${loggingPrefix} Error rendering link ${linkId}:`, e, link);
        missingLinkCount++;
      }
    });

    nodeIds.forEach(nodeId => {
      const node = getNodeById(String(nodeId));
      if (!node || !node.coordinates || !Array.isArray(node.coordinates) || node.coordinates.length < 2) {
        // console.warn(`${loggingPrefix} Node ID ${nodeId} not found or coordinates invalid.`);
        missingNodeCount++;
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
        console.error(`${loggingPrefix} Error rendering node ${nodeId}:`, e, node);
        missingNodeCount++;
      }
    });

    activePolylinesRef.current = newPolylines;
    activeMarkersRef.current = newMarkers;
    console.log(`${loggingPrefix} Route rendering complete: ${newPolylines.length} links, ${newMarkers.length} nodes. (Missing: ${missingLinkCount} links, ${missingNodeCount} nodes)`);
    
    if (onRenderingComplete) {
      onRenderingComplete(); // Call the completion callback
    }
    
    return newRenderedFeatures;
  }, [map, isLoaded, clearDisplayedFeatures, getLinkById, getNodeById, onRenderingComplete]);

  return {
    renderRoute,
    clearDisplayedFeatures,
  };
};
