import { Place } from '@/types/supabase';

const DEFAULT_MARKER_ICON_URL = '/assets/markers/default-marker.png';
const SELECTED_MARKER_ICON_URL = '/assets/markers/selected-marker.png'; // 선택된 장소 아이콘
const CANDIDATE_MARKER_ICON_URL = '/assets/markers/candidate-marker.png'; // 후보 장소 아이콘

const CATEGORY_MARKERS: Record<string, string> = {
  '숙소': '/assets/markers/accommodation-marker.png',
  '관광지': '/assets/markers/landmark-marker.png',
  '음식점': '/assets/markers/restaurant-marker.png',
  '카페': '/assets/markers/cafe-marker.png',
};

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

export const createNaverPolyline = (
  map: any,
  path: any[], // naver.maps.LatLng[]
  options: {
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    strokeStyle?: string;
    strokeLineCap?: string;
    strokeLineJoin?: string;
    clickable?: boolean;
    visible?: boolean;
    zIndex?: number;
  }
) => {
  const polyline = new window.naver.maps.Polyline({
    map: map,
    path: path,
    strokeColor: options.strokeColor || '#000000',
    strokeOpacity: options.strokeOpacity || 0.8,
    strokeWeight: options.strokeWeight || 5,
    strokeStyle: options.strokeStyle || 'solid',
    strokeLineCap: options.strokeLineCap || 'round',
    strokeLineJoin: options.strokeLineJoin || 'round',
    clickable: options.clickable || true,
    visible: options.visible !== false,
    zIndex: options.zIndex || 0,
  });
  return polyline;
};

export const clearPolylines = (polylines: any[]) => {
  polylines.forEach(polyline => {
    polyline.setMap(null);
  });
};

// 마커 생성 함수 - 아이콘 URL 또는 HTML 콘텐츠를 받을 수 있도록 수정
export const createNaverMarker = (
  map: any,
  position: any, // naver.maps.LatLng
  iconConfig?: { url?: string; size?: { width: number; height: number }; anchor?: { x: number; y: number }; content?: string },
  title?: string,
  clickable: boolean = true,
  visible: boolean = true
) => {
  let iconObject: any = null;
  if (iconConfig) {
    if (iconConfig.url) {
      iconObject = {
        url: iconConfig.url,
        size: iconConfig.size ? new window.naver.maps.Size(iconConfig.size.width, iconConfig.size.height) : undefined,
        anchor: iconConfig.anchor ? new window.naver.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y) : undefined,
        scaledSize: iconConfig.size ? new window.naver.maps.Size(iconConfig.size.width, iconConfig.size.height) : undefined, // Ensure scaledSize is set if size is
      };
    } else if (iconConfig.content) {
      iconObject = {
        content: iconConfig.content,
        anchor: iconConfig.anchor ? new window.naver.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y) : new window.naver.maps.Point(5,5), // Default anchor for content
      };
    }
  }

  return new window.naver.maps.Marker({
    position: position,
    map: map,
    icon: iconObject,
    title: title,
    clickable: clickable,
    visible: visible,
  });
};

// 기존 마커 옵션 함수는 유지하되, 새로운 마커 타입을 위한 설정 추가
export const getMarkerIconOptions = (
  place: Place,
  isSelected: boolean,
  isCandidate: boolean,
  isItineraryPlace: boolean,
  useColorByCategory?: boolean // New optional parameter
): { url?: string; size?: { width: number; height: number }; anchor?: { x: number; y: number }; content?: string } => {
  if (isItineraryPlace) {
    return {
      content: '<div style="width:10px;height:10px;background-color:red;border-radius:50%;border:1px solid darkred;box-shadow: 0 0 3px rgba(0,0,0,0.5);"></div>',
      anchor: { x: 5, y: 5 }
    };
  }
  if (isSelected) {
    return { url: SELECTED_MARKER_ICON_URL, size: { width: 30, height: 40 }, anchor: { x: 15, y: 40 } };
  }
  if (isCandidate) { // This was often used for 'recommended style' or similar general highlighting
    return { url: CANDIDATE_MARKER_ICON_URL, size: { width: 28, height: 36 }, anchor: { x: 14, y: 36 } };
  }
  
  // If useColorByCategory is true, prioritize category markers
  if (useColorByCategory && place.category && CATEGORY_MARKERS[place.category]) {
    return { url: CATEGORY_MARKERS[place.category], size: { width: 25, height: 34 }, anchor: { x: 12.5, y: 34 } };
  }
  
  // Fallback to default or existing category logic if not using color by category explicitly or if category marker doesn't exist
  const iconUrl = CATEGORY_MARKERS[place.category] || DEFAULT_MARKER_ICON_URL;
  return { url: iconUrl, size: { width: 25, height: 34 }, anchor: { x: 12.5, y: 34 } };
};

export const addMarkersToMap = (
  map: any,
  places: Place[],
  selectedPlace: Place | null,
  candidatePlaces: Place[] = [], // isCandidate로 판단
  itineraryPlaces: Place[] = [], // 현재 날짜의 일정 장소들
  onMarkerClick: (place: Place, index: number) => void
) => {
  const markers: any[] = [];
  places.forEach((place, index) => {
    const position = createNaverLatLng(place.y, place.x);
    const isSelected = selectedPlace?.id === place.id;
    const isCandidate = candidatePlaces.some(cp => cp.id === place.id);
    const isItineraryPlace = itineraryPlaces.some(ip => ip.id === place.id);
    
    const iconOptions = getMarkerIconOptions(place, isSelected, isCandidate, isItineraryPlace);
    
    const marker = createNaverMarker(map, position, iconOptions, place.name);
    
    window.naver.maps.Event.addListener(marker, 'click', () => {
      onMarkerClick(place, index);
    });
    markers.push(marker);
  });
  return markers;
};

export const clearMarkers = (markers: any[]) => {
  markers.forEach(marker => {
    marker.setMap(null);
  });
};

export const panToPosition = (map: any, lat: number, lng: number) => {
  if (!map || !window.naver || !window.naver.maps) {
    console.error("Naver Maps API is not initialized.");
    return;
  }

  const newLatlng = new window.naver.maps.LatLng(lat, lng);
  map.panTo(newLatlng);
};

export const fitBoundsToPlaces = (map: any, places: Place[]) => {
  if (!map || !window.naver || !window.naver.maps || places.length === 0) {
    console.warn("지도 객체가 없거나, 장소 목록이 비어 있습니다.");
    return;
  }

  const bounds = new window.naver.maps.LatLngBounds();
  places.forEach(place => {
    bounds.extend(new window.naver.maps.LatLng(place.y, place.x));
  });

  try {
    map.fitBounds(bounds);
  } catch (error) {
    console.error("fitBounds 중 오류 발생:", error);
  }
};

// Added function: fitBoundsToCoordinates
export const fitBoundsToCoordinates = (map: any, coordinates: any[]) => { // coordinates are naver.maps.LatLng[]
  if (!map || !window.naver || !window.naver.maps || coordinates.length === 0) {
    console.warn("fitBoundsToCoordinates: 지도 객체가 없거나, 좌표 목록이 비어 있습니다.");
    return;
  }

  const bounds = new window.naver.maps.LatLngBounds();
  coordinates.forEach(coord => {
    if (coord instanceof window.naver.maps.LatLng) {
      bounds.extend(coord);
    } else {
      console.warn("fitBoundsToCoordinates: Invalid coordinate object passed.");
    }
  });

  if (bounds.isEmpty()) {
    console.warn("fitBoundsToCoordinates: No valid coordinates to fit bounds.");
    return;
  }
  
  try {
    map.fitBounds(bounds);
  } catch (error) {
    console.error("fitBoundsToCoordinates 중 오류 발생:", error);
  }
};

// Added function: clearInfoWindows
export const clearInfoWindows = (infoWindows: any[]) => {
  infoWindows.forEach(iw => {
    if (iw && typeof iw.close === 'function') { // Naver InfoWindow uses close()
      iw.close();
    } else if (iw && typeof iw.setMap === 'function') { // Some might use setMap(null)
      iw.setMap(null);
    }
  });
  // This function might need to manage a ref similar to markers/polylines if these are stored in a shared ref
};

// Added function: clearOverlayByCondition
// This function now returns the array of overlays that were KEPT.
// The caller is responsible for updating its reference to this new array.
export const clearOverlayByCondition = (
  mapOverlays: Array<{overlay: any; type: string; [key: string]: any}>,
  conditionToRemove: (overlayDetail: { overlay: any; type: string; [key: string]: any }) => boolean
): Array<{overlay: any; type: string; [key: string]: any}> => {
  const overlaysToKeep: Array<{ overlay: any; type: string; [key: string]: any }> = [];
  mapOverlays.forEach(overlayDetail => {
    if (conditionToRemove(overlayDetail)) {
      if (overlayDetail.overlay && typeof overlayDetail.overlay.setMap === 'function') {
        overlayDetail.overlay.setMap(null); // Remove from map
      }
    } else {
      overlaysToKeep.push(overlayDetail); // Keep this one
    }
  });
  return overlaysToKeep;
};
