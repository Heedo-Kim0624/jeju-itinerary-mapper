
import type { Place } from '@/types/supabase';
import type { ItineraryPlaceWithTime } from '@/types/core';
import { createNaverLatLng } from './mapSetup';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';

// Helper function to create SVG string for a map circle
const createCircleMarkerSvg = (
  color: string,
  size: number = 36, // Default size for the circle
  label?: string | number,
  innerCircleColor: string = 'white'
): string => {
  // 테두리와 배경색 설정
  const strokeColor = "white";
  const strokeWidth = 2;
  
  // 레이블 설정
  let labelContent = '';
  if (label) {
    // 숫자 레이블에 대한 스타일링
    const fontSize = Math.max(size * 0.45, 14); // 최소 폰트 크기 보장
    labelContent = `
      <text 
        x="${size/2}" 
        y="${size/2}" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        fill="white" 
        font-family="Arial, sans-serif" 
        font-weight="bold" 
        font-size="${fontSize}px">${label}</text>
    `;
  }

  // SVG 원 생성
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle 
        cx="${size/2}" 
        cy="${size/2}" 
        r="${size/2 - strokeWidth/2}" 
        fill="${color}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" />
      ${labelContent}
    </svg>
  `;
};

export const getMarkerIconOptions = (
  place: Place | ItineraryPlaceWithTime,
  isSelected: boolean,
  isCandidate: boolean,
  isItineraryDayPlace: boolean,
  itineraryOrder?: number
): { content: string; anchor: { x: number; y: number }; size?: {width: number; height: number} } => {
  let pinColor: string;
  let pinSize = 28;
  let label: string | number | undefined = undefined;

  if (isItineraryDayPlace) {
    pinColor = (place as ItineraryPlaceWithTime).isFallback ? '#757575' : '#FF5A5F'; // Red for itinerary items, gray for fallback
    pinSize = 36; // Slightly larger for itinerary items
    label = itineraryOrder;
  } else if (isSelected) {
    pinColor = '#007BFF'; // Blue for selected
    pinSize = 32; // Larger for selected
  } else if (isCandidate) {
    pinColor = '#FFA500'; // Orange for candidate
    pinSize = 32;
  } else if (place.category) {
    const categoryKey = mapCategoryNameToKey(place.category);
    pinColor = getCategoryColor(categoryKey);
    pinSize = 24; // Default size for category markers
  } else {
    pinColor = '#28A745'; // Fallback Default Green if no category or other state matches
  }

  // 원형 마커 사용
  const markerContent = createCircleMarkerSvg(pinColor, pinSize, label);
  
  return {
    content: markerContent,
    anchor: { x: pinSize / 2, y: pinSize / 2 }, // 앵커 포인트를 원의 중심으로 조정
    size: { width: pinSize, height: pinSize }
  };
};

export const createNaverMarker = (
  map: any,
  position: any, // naver.maps.LatLng
  iconConfig?: { url?: string; size?: { width: number; height: number }; anchor?: { x: number; y: number }; content?: string },
  title?: string,
  clickable: boolean = true,
  visible: boolean = true
) => {
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API not initialized when creating marker.");
    return null;
  }
  let iconObject: any = null;
  if (iconConfig) {
    if (iconConfig.url) {
      iconObject = {
        url: iconConfig.url,
        size: iconConfig.size ? new window.naver.maps.Size(iconConfig.size.width, iconConfig.size.height) : undefined,
        anchor: iconConfig.anchor ? new window.naver.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y) : undefined,
        scaledSize: iconConfig.size ? new window.naver.maps.Size(iconConfig.size.width, iconConfig.size.height) : undefined,
      };
    } else if (iconConfig.content) {
      iconObject = {
        content: iconConfig.content,
        anchor: iconConfig.anchor ? new window.naver.maps.Point(iconConfig.anchor.x, iconConfig.anchor.y) : 
                new window.naver.maps.Point(
                  iconConfig.size?.width ? iconConfig.size.width/2 : 14, 
                  iconConfig.size?.height ? iconConfig.size.height/2 : 14
                ), // 앵커 포인트를 원의 중심으로 조정
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

export const addMarkersToMap = (
  map: any,
  places: Place[],
  selectedPlace: Place | null,
  candidatePlaces: Place[] = [],
  onMarkerClick: (place: Place, index: number) => void
) => {
  const markers: any[] = [];
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API not available in addMarkersToMap");
    return markers;
  }
  places.forEach((place, index) => {
    if (place.y == null || place.x == null) { // Check for null or undefined
        console.warn(`[markerUtils] Place '${place.name}' is missing coordinates (y: ${place.y}, x: ${place.x}) and will be skipped.`);
        return;
    }
    const position = createNaverLatLng(place.y, place.x);
    if (!position) return;

    const isSelected = selectedPlace?.id === place.id;
    const isCandidate = candidatePlaces.some(cp => cp.id === place.id);
    
    const iconOptions = getMarkerIconOptions(place, isSelected, isCandidate, false, undefined);
    
    const marker = createNaverMarker(map, position, iconOptions, place.name);
    
    if (marker && window.naver.maps.Event) {
      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick(place, index);
      });
    }
    if (marker) markers.push(marker);
  });
  return markers;
};
