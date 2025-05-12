
import { toast } from "sonner";

// Jeju Island center coordinates
export const JEJU_CENTER = { lat: 33.3617, lng: 126.5292 };

export const initializeNaverMap = (mapContainer: HTMLDivElement | null) => {
  if (!mapContainer) {
    console.error("Map container is not available");
    return null;
  }
  
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API is not loaded");
    return null;
  }

  try {
    const mapOptions = {
      center: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
      zoom: 10,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT
      }
    };

    console.log("Creating new Naver Map instance");
    const map = new window.naver.maps.Map(mapContainer, mapOptions);
    
    return map;
  } catch (error) {
    console.error("Error initializing map:", error);
    toast.error("지도 초기화에 실패했습니다.");
    return null;
  }
};
