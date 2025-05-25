
import { createNaverPolyline } from './polylineUtils';
import { createNaverLatLng } from './mapSetup';
import { isValidCoordinate } from './coordinateUtils'; // 추가

export const drawRoutePathInternal = (
  map: any,
  isNaverLoaded: boolean,
  pathCoordinates: { lat: number; lng: number }[],
  color: string,
  weight?: number,
  opacity?: number,
  zIndex?: number
): any | null => {
  if (!isNaverLoaded || !map || !pathCoordinates || pathCoordinates.length < 2) {
    // console.warn('[drawRoutePathInternal] Preconditions not met for drawing route.'); // 너무 빈번할 수 있어 주석 처리
    return null;
  }

  const validNaverPath = pathCoordinates
    .map(coord => {
      if (!isValidCoordinate(coord.lat, coord.lng)) {
        console.warn(`[drawRoutePathInternal] Invalid coordinate object: {lat: ${coord.lat}, lng: ${coord.lng}}`);
        return null;
      }
      const latLng = createNaverLatLng(coord.lat, coord.lng);
      if (!latLng) { // createNaverLatLng 내부에서도 오류가 발생할 수 있음
        console.warn(`[drawRoutePathInternal] Failed to create Naver LatLng for: {lat: ${coord.lat}, lng: ${coord.lng}}`);
        return null;
      }
      return latLng;
    })
    .filter(p => p !== null) as any[]; // naver.maps.LatLng[]

  if (validNaverPath.length < 2) {
    console.warn('[drawRoutePathInternal] Not enough valid coordinates to draw a polyline after validation.');
    return null;
  }

  return createNaverPolyline(map, validNaverPath, {
    strokeColor: color,
    strokeWeight: weight,
    strokeOpacity: opacity,
    zIndex: zIndex,
    clickable: false, // 경로 폴리라인은 보통 클릭 불필요
  });
};

// 만약 다른 함수들이 있다면 여기에 위치
// export const anotherFunction = () => { ... };
