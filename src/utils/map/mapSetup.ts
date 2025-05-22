
import type { Place } from '@/types/supabase'; // Assuming this is the intended Place type based on mapDrawing.ts

export const createNaverMap = (mapContainerId: string, center: { lat: number; lng: number }, zoom: number) => {
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API is not initialized.");
    return null;
  }

  const mapOptions = {
    center: new window.naver.maps.LatLng(center.lat, center.lng),
    zoom: zoom,
    minZoom: 8,
    maxZoom: 17,
    zoomControl: true,
    zoomControlOptions: {
      style: window.naver.maps.ZoomControlStyle.SMALL,
      position: window.naver.maps.Position.TOP_RIGHT
    },
    scaleControl: true,
    scaleControlOptions: {
      position: window.naver.maps.Position.BOTTOM_RIGHT
    },
    mapDataControl: true,
    mapDataControlOptions: {
      style: window.naver.maps.MapDataControlStyle.DROPDOWN,
      position: window.naver.maps.Position.TOP_LEFT
    }
  };

  const map = new window.naver.maps.Map(mapContainerId, mapOptions);
  return map;
};

export const createNaverLatLng = (lat: number, lng: number) => {
  if (!window.naver || !window.naver.maps) {
    // console.error("Naver Maps API is not initialized when calling createNaverLatLng."); // Reduced console noise
    return null; // Return null or throw error, depending on desired handling
  }
  return new window.naver.maps.LatLng(lat, lng);
};

