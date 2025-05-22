import { Place } from '@/types/supabase';
import type { ItineraryPlaceWithTime } from '@/types/core';

const DEFAULT_MARKER_ICON_URL = '/assets/markers/default-marker.png';
const SELECTED_MARKER_ICON_URL = '/assets/markers/selected-marker.png'; // 선택된 장소 아이콘
const CANDIDATE_MARKER_ICON_URL = '/assets/markers/candidate-marker.png'; // 후보 장소 아이콘

const CATEGORY_MARKERS: Record<string, string> = {
  '숙소': '/assets/markers/accommodation-marker.png',
  '관광지': '/assets/markers/landmark-marker.png',
  '음식점': '/assets/markers/restaurant-marker.png',
  '카페': '/assets/markers/cafe-marker.png',
};

// Helper function to create SVG string for a map pin
// Uses the structure of lucide-react's map-pin icon
const createPinSvg = (
  color: string,
  size: number = 28, // Adjusted default size
  label?: string | number,
  innerCircleColor: string = 'white'
): string => {
  const strokeColor = "black"; // Outline for the pin shape itself for better visibility
  const strokeWeight = 0.5; // Thinner stroke for the pin outline
  
  // Scale down viewBox elements if using a fixed viewBox="0 0 24 24"
  const pathScaleFactor = size / 24;
  const scaledInnerRadius = 3 * pathScaleFactor; // Original inner circle radius is 3 in a 24x24 viewbox
  const scaledCx = 12 * pathScaleFactor;
  const scaledCy = 10 * pathScaleFactor;

  let labelContent = '';
  if (label) {
    const fontSize = size * 0.45; // Adjust font size based on pin size
    // Position text within the head of the pin.
    // For a 24x24 viewBox, text at y="10" (cy of circle) works well.
    const textY = 10; // Y position in viewBox units
    const textX = 12; // X position in viewBox units

    labelContent = `<text x="${textX}" y="${textY}" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold">${label}</text>`;
  }

  // Standard 24x24 viewBox, actual display size controlled by width/height attributes of SVG tag
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="overflow: visible;">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWeight}" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="10" r="3" fill="${innerCircleColor}"/>
      ${labelContent}
    </svg>
  `;
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

export const getMarkerIconOptions = (
  place: Place | ItineraryPlaceWithTime, // Union type to handle both
  isSelected: boolean, // For info window target or general highlight
  isCandidate: boolean, // For 'globally selected' from left panel (selectedPlaces)
  isItineraryDayPlace: boolean, // True if this place is part of the currently displayed itinerary day
  itineraryOrder?: number // The number for itinerary day place (e.g., 1, 2, 3)
): { content: string; anchor: { x: number; y: number }; size?: {width: number; height: number} } => {
  let pinColor = '#28A745'; // Default Green
  let pinSize = 28;
  let label: string | number | undefined = undefined;
  const anchorY = pinSize; // Tip of the pin

  if (isItineraryDayPlace) {
    pinColor = (place as ItineraryPlaceWithTime).isFallback ? '#757575' : '#FF5A5F'; // Red for itinerary items, gray for fallback
    pinSize = 32; // Slightly larger for itinerary items
    label = itineraryOrder;
  } else if (isSelected) {
    pinColor = '#007BFF'; // Blue for selected
    pinSize = 32; // Larger for selected
  } else if (isCandidate) {
    pinColor = '#FFA500'; // Orange for candidate
  }
  // Else, default green is used.

  return {
    content: createPinSvg(pinColor, pinSize, label),
    anchor: { x: pinSize / 2, y: pinSize }, // Anchor at the bottom center (tip of the pin)
    size: { width: pinSize, height: pinSize } // Required by Naver Maps for content icons if not using URL
  };
};

export const addMarkersToMap = (
  map: any,
  places: Place[],
  selectedPlace: Place | null,
  candidatePlaces: Place[] = [],
  itineraryPlaces: Place[] = [], // This might be unused if useMapMarkers is the main driver
  onMarkerClick: (place: Place, index: number) => void
) => {
  const markers: any[] = [];
  places.forEach((place, index) => {
    const position = createNaverLatLng(place.y, place.x);
    if (!position) return;

    const isSelected = selectedPlace?.id === place.id;
    const isCandidate = candidatePlaces.some(cp => cp.id === place.id);
    // For this generic function, isItineraryDayPlace and itineraryOrder are not easily determined
    // It should perhaps take a simpler marker type or rely on a simpler version of getMarkerIconOptions
    
    const iconOptions = getMarkerIconOptions(place, isSelected, isCandidate, false, undefined);
    
    const marker = createNaverMarker(map, position, iconOptions, place.name);
    
    if (window.naver && window.naver.maps && window.naver.maps.Event) {
      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick(place, index);
      });
    }
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
  if (!map || !window.naver || !window.naver.maps || !places || places.length === 0) {
    console.warn("[mapDrawing] fitBoundsToPlaces: 지도 객체가 없거나, 장소 목록이 비어 있습니다.");
    return;
  }

  try {
    const bounds = new window.naver.maps.LatLngBounds();
    let hasValidCoords = false;

    places.forEach(place => {
      if (place.y && place.x && !isNaN(Number(place.y)) && !isNaN(Number(place.x))) {
        bounds.extend(new window.naver.maps.LatLng(Number(place.y), Number(place.x)));
        hasValidCoords = true;
      }
    });

    if (hasValidCoords) {
      const ne = bounds.getNE();
      const sw = bounds.getSW();
      
      if (ne && sw && !ne.equals(sw)) { // Check if bounds are valid (not empty or single point)
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else if (ne && sw && ne.equals(sw) && places.length === 1) { // Single point, pan and zoom
        map.setCenter(ne);
        map.setZoom(14); // Default zoom for a single point
      } else {
        console.warn("[mapDrawing] fitBoundsToPlaces: 유효한 경계를 계산할 수 없거나 단일 지점입니다.");
      }
    } else {
      console.warn("[mapDrawing] fitBoundsToPlaces: 유효한 좌표가 있는 장소가 없습니다.");
    }
  } catch (error) {
    console.error("[mapDrawing] fitBoundsToPlaces 중 오류 발생:", error);
  }
};

export const fitBoundsToCoordinates = (map: any, coordinates: { lat: number; lng: number }[]) => { 
  if (!map || !window.naver || !window.naver.maps || !coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    console.warn("[mapDrawing] fitBoundsToCoordinates: 지도 객체가 없거나, 좌표 목록이 비어 있습니다.");
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
        console.warn("[mapDrawing] fitBoundsToCoordinates: Invalid coordinate object passed:", coord);
      }
    });
    
    if (hasValidCoords) {
      const ne = bounds.getNE();
      const sw = bounds.getSW();
      
      if (ne && sw && !ne.equals(sw)) { // Check if bounds are valid
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      } else if (ne && sw && ne.equals(sw) && coordinates.length === 1) { // Single point
        map.setCenter(ne);
        map.setZoom(14);
      } else {
        console.warn("[mapDrawing] fitBoundsToCoordinates: 유효한 경계를 계산할 수 없거나 단일 지점입니다.");
      }
    } else {
      console.warn("[mapDrawing] fitBoundsToCoordinates: 유효한 좌표가 없습니다.");
    }
  } catch (error) {
    console.error("[mapDrawing] fitBoundsToCoordinates 중 오류 발생:", error);
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
