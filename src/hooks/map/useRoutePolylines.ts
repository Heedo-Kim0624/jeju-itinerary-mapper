
import { useCallback, useRef } from 'react';
import { drawRoutePathInternal } from '@/utils/map/routeDrawingUtils';

interface UseRoutePolylinesProps {
  map: any;
  isNaverLoadedParam: boolean;
}

export const useRoutePolylines = ({ map, isNaverLoadedParam }: UseRoutePolylinesProps) => {
  const activePolylinesRef = useRef<any[]>([]);
  const highlightedPathRef = useRef<any>(null);

  const addPolyline = useCallback((
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ): any | null => {
    const polyline = drawRoutePathInternal(
      map,
      isNaverLoadedParam,
      pathCoordinates,
      color,
      weight,
      opacity,
      zIndex
    );
    if (polyline) {
      activePolylinesRef.current.push(polyline);
    }
    return polyline;
  }, [map, isNaverLoadedParam]);

  const setHighlightedPolyline = useCallback((
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ): any | null => {
    if (highlightedPathRef.current && typeof highlightedPathRef.current.setMap === 'function') {
      highlightedPathRef.current.setMap(null);
    }
    const polyline = drawRoutePathInternal(
      map,
      isNaverLoadedParam,
      pathCoordinates,
      color,
      weight,
      opacity,
      zIndex
    );
    highlightedPathRef.current = polyline;
    return polyline;
  }, [map, isNaverLoadedParam]);

  const clearActivePolylines = useCallback(() => {
    activePolylinesRef.current.forEach(p => {
      if (p && typeof p.setMap === 'function') p.setMap(null);
    });
    activePolylinesRef.current = [];
  }, []);

  const clearHighlightedPolyline = useCallback(() => {
    if (highlightedPathRef.current && typeof highlightedPathRef.current.setMap === 'function') {
      highlightedPathRef.current.setMap(null);
    }
    highlightedPathRef.current = null;
  }, []);

  const clearAllMapPolylines = useCallback(() => {
    console.log('[RoutePolylines] Clearing all polylines.');
    clearActivePolylines();
    clearHighlightedPolyline();
  }, [clearActivePolylines, clearHighlightedPolyline]);

  return {
    addPolyline,
    setHighlightedPolyline,
    clearActivePolylines,
    clearHighlightedPolyline,
    clearAllMapPolylines,
  };
};
