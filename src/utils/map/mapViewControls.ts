
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

export const fitBoundsToCoordinates = (map: any, coordinates: { lat: number; lng: number }[]) => { 
  if (!map || !window.naver || !window.naver.maps || !coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    console.warn("[mapViewControls] fitBoundsToCoordinates: 지도 객체가 없거나, 좌표 목록이 비어 있습니다.");
    return;
  }

  try {
    const bounds = new window.naver.maps.LatLngBounds();
    let hasValidCoords = false;

    coordinates.forEach(coord => {
      if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' && !isNaN(coord.lat) && !isNaN(coord.lng)) {
        bounds.extend(new window.naver.maps.LatLng(coord.lat, coord.lng));
        hasValidCoords = true;
      } else {
        console.warn("[mapViewControls] fitBoundsToCoordinates: Invalid coordinate object passed:", coord);
      }
    });
    
    if (hasValidCoords) {
      const ne = bounds.getNE();
      const sw = bounds.getSW();
      
      if (ne && sw && !ne.equals(sw)) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else if (ne && sw && ne.equals(sw) && coordinates.length === 1) { 
        map.setCenter(ne);
        map.setZoom(14);
      } else {
        console.warn("[mapViewControls] fitBoundsToCoordinates: 유효한 경계를 계산할 수 없거나 단일 지점입니다.");
      }
    } else {
      console.warn("[mapViewControls] fitBoundsToCoordinates: 유효한 좌표가 없습니다.");
    }
  } catch (error) {
    console.error("[mapViewControls] fitBoundsToCoordinates 중 오류 발생:", error);
  }
};

