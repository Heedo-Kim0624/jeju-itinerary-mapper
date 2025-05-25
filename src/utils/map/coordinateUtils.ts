
/**
 * 좌표 값의 유효성을 검사합니다 (위도, 경도 순서).
 */
export const isValidCoordinate = (lat: any, lng: any): boolean => {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 && // 위도 범위
    lng >= -180 && lng <= 180 // 경도 범위
  );
};

/**
 * GeoJSON 좌표 배열 [lng, lat][]을 네이버맵 LatLng 객체 배열로 변환합니다.
 */
export const geoJsonCoordsToNaverLatLngArray = (
  geoJsonCoordsArray: [number, number][],
  naverMapsApi: any
): any[] => {
  if (!geoJsonCoordsArray || !Array.isArray(geoJsonCoordsArray) || !naverMapsApi || !naverMapsApi.LatLng) {
    console.warn('[coordinateUtils] 유효하지 않은 geoJsonCoordsToNaverLatLngArray 입력');
    return [];
  }

  return geoJsonCoordsArray
    .map(coordPair => {
      if (!Array.isArray(coordPair) || coordPair.length < 2) {
        console.warn('[coordinateUtils] 유효하지 않은 GeoJSON 좌표 쌍 형식:', coordPair);
        return null;
      }
      const [lng, lat] = coordPair;
      if (!isValidCoordinate(lat, lng)) {
        console.warn(`[coordinateUtils] 유효하지 않은 GeoJSON 좌표 값: lng=${lng}, lat=${lat}`);
        return null;
      }
      try {
        return new naverMapsApi.LatLng(lat, lng);
      } catch (error) {
        console.error('[coordinateUtils] GeoJSON 좌표로부터 LatLng 객체 생성 오류:', error);
        return null;
      }
    })
    .filter(latLng => latLng !== null);
};

/**
 * 일반 좌표 객체 배열 {lat, lng}[]을 네이버맵 LatLng 객체 배열로 변환합니다.
 */
export const coordsToNaverLatLngArray = (
  coordsArray: { lat: number; lng: number }[],
  naverMapsApi: any
): any[] => {
  if (!coordsArray || !Array.isArray(coordsArray) || !naverMapsApi || !naverMapsApi.LatLng) {
    console.warn('[coordinateUtils] 유효하지 않은 coordsToNaverLatLngArray 입력');
    return [];
  }

  return coordsArray
    .map(coord => {
      if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
        console.warn('[coordinateUtils] 유효하지 않은 좌표 객체:', coord);
        return null;
      }
      if (!isValidCoordinate(coord.lat, coord.lng)) {
        console.warn(`[coordinateUtils] 유효하지 않은 좌표 값: lat=${coord.lat}, lng=${coord.lng}`);
        return null;
      }
      try {
        return new naverMapsApi.LatLng(coord.lat, coord.lng);
      } catch (error) {
        console.error('[coordinateUtils] 좌표 객체로부터 LatLng 객체 생성 오류:', error);
        return null;
      }
    })
    .filter(latLng => latLng !== null);
};

