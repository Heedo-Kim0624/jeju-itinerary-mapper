
import { toast } from "sonner";

// Jeju Island center coordinates
export const JEJU_CENTER = { lat: 33.3617, lng: 126.5292 };

export const initializeNaverMap = (mapContainer: HTMLDivElement | null) => {
  if (!mapContainer || !window.naver || !window.naver.maps) {
    console.error("Cannot initialize map - container or naver maps not available");
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
      },
      // 기본 확대 레벨 조정 (낮을수록 더 넓은 영역을 보여줌)
      defaultLevel: 7
    };

    const map = new window.naver.maps.Map(mapContainer, mapOptions);
    
    window.naver.maps.Event.once(map, 'init', () => {
      console.log("Naver Map initialized");
    });

    return map;
  } catch (error) {
    console.error("Error initializing map:", error);
    toast.error("지도 초기화에 실패했습니다.");
    return null;
  }
};
