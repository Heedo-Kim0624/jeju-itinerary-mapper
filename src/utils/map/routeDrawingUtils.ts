
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { createNaverPolyline } from '@/utils/map/polylineUtils';

/**
 * Draws a single polyline path on the map.
 * This is an internal utility function.
 */
export const drawRoutePathInternal = (
  currentMap: any,
  isNaverLoaded: boolean,
  pathCoordinates: { lat: number; lng: number }[],
  color: string,
  weight: number = 5,
  opacity: number = 0.7,
  zIndex: number = 1
): any | null => {
  if (!currentMap || !isNaverLoaded || pathCoordinates.length < 2) return null;

  const validCoords = pathCoordinates.filter(coord =>
    coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' &&
    !isNaN(coord.lat) && !isNaN(coord.lng)
  );

  if (validCoords.length < 2) {
    console.warn('[RouteDrawingUtils] drawRoutePathInternal: Not enough valid coordinates for path.');
    return null;
  }
  
  const naverPath = validCoords.map(coord => createNaverLatLng(coord.lat, coord.lng)).filter(p => p !== null);
  if (naverPath.length < 2) {
    console.warn('[RouteDrawingUtils] drawRoutePathInternal: Not enough valid Naver LatLng objects for path.');
    return null;
  }

  try {
    const polyline = createNaverPolyline(currentMap, naverPath as any[], {
      strokeColor: color,
      strokeWeight: weight,
      strokeOpacity: opacity,
      zIndex: zIndex,
    });
    return polyline;
  } catch (error) {
    console.error('[RouteDrawingUtils] Error creating polyline:', error);
    return null;
  }
};
