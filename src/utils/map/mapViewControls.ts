import type { Place } from '@/types/supabase';

export const panToPosition = (map: any, lat: number, lng: number) => {
  if (!map || !window.naver || !window.naver.maps) {
    console.error("Naver Maps API is not initialized.");
    return;
  }

  const newLatlng = new window.naver.maps.LatLng(lat, lng);
  map.panTo(newLatlng);
};

export const fitBoundsToPlaces = (map: any, places: Place[]) => {
  if (!map || !window.naver || !window.naver.maps || !places || places.length === 0) {
    console.warn("[mapViewControls] fitBoundsToPlaces: 지도 객체가 없거나, 장소 목록이 비어 있습니다.");
    return;
  }

  try {
    const bounds = new window.naver.maps.LatLngBounds();
    let hasValidCoords = false;

    places.forEach(place => {
      if (place.y != null && place.x != null && !isNaN(Number(place.y)) && !isNaN(Number(place.x))) {
        bounds.extend(new window.naver.maps.LatLng(Number(place.y), Number(place.x)));
        hasValidCoords = true;
      }
    });

    if (hasValidCoords) {
      const ne = bounds.getNE();
      const sw = bounds.getSW();
      
      if (ne && sw && !ne.equals(sw)) { 
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else if (ne && sw && ne.equals(sw) && places.length === 1) { 
        map.setCenter(ne);
        map.setZoom(14); 
      } else {
        console.warn("[mapViewControls] fitBoundsToPlaces: 유효한 경계를 계산할 수 없거나 단일 지점입니다.");
      }
    } else {
      console.warn("[mapViewControls] fitBoundsToPlaces: 유효한 좌표가 있는 장소가 없습니다.");
    }
  } catch (error) {
    console.error("[mapViewControls] fitBoundsToPlaces 중 오류 발생:", error);
  }
};

export const fitBoundsToCoordinates = (map: any, naverLatLngArray: any[]) => {
  if (!map || !window.naver || !window.naver.maps || !naverLatLngArray || !Array.isArray(naverLatLngArray) || naverLatLngArray.length === 0) {
    console.warn("[mapViewControls] fitBoundsToCoordinates: 지도 객체가 없거나, Naver LatLng 좌표 목록이 비어 있습니다.");
    return;
  }

  try {
    const bounds = new window.naver.maps.LatLngBounds();
    let validCoordsCount = 0;

    naverLatLngArray.forEach(coord => {
      if (coord && typeof coord.lat === 'function' && typeof coord.lng === 'function') {
        try {
          const lat = coord.lat();
          const lng = coord.lng();
          if (typeof lat === 'number' && typeof lng === 'number' &&
              !isNaN(lat) && !isNaN(lng) &&
              isFinite(lat) && isFinite(lng) &&
              lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            bounds.extend(coord);
            validCoordsCount++;
          } else {
            console.warn(`[mapViewControls] fitBoundsToCoordinates: 유효하지 않은 LatLng 내부 값: lat=${lat}, lng=${lng}`);
          }
        } catch (e) {
          console.warn("[mapViewControls] fitBoundsToCoordinates: LatLng 객체 값 접근 중 오류:", e, coord);
        }
      } else {
        console.warn("[mapViewControls] fitBoundsToCoordinates: 유효하지 않은 Naver LatLng 객체 전달됨:", coord);
      }
    });
    
    if (validCoordsCount > 0) {
      const ne = bounds.getNE();
      const sw = bounds.getSW();
      
      if (ne && sw && !ne.equals(sw)) { // 여러 유효한 좌표가 있는 경우
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else if (ne && sw && ne.equals(sw) && validCoordsCount === 1) { // 단일 유효 좌표
        map.setCenter(ne);
        map.setZoom(14); // 단일 지점일 경우 적절한 줌 레벨 설정
      } else {
         // 이 경우는 bounds가 비어있거나 모든 점이 동일한 경우인데, validCoordsCount > 0 조건으로 이미 필터링되었을 수 있음
        console.warn(`[mapViewControls] fitBoundsToCoordinates: 유효한 경계를 계산할 수 없거나 모든 좌표가 동일합니다. Valid coords: ${validCoordsCount}`);
      }
    } else {
      console.warn("[mapViewControls] fitBoundsToCoordinates: 유효한 Naver LatLng 좌표가 없습니다.");
    }
  } catch (error) {
    console.error("[mapViewControls] fitBoundsToCoordinates 중 오류 발생:", error);
  }
};
