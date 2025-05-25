
import type { Place } from '@/types/supabase';
import type { ItineraryPlaceWithTime } from '@/types/core';
import { createNaverLatLng } from './mapSetup';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';

// SVG 마커 생성 유틸리티
const createCircleMarkerSvg = (
  color: string,
  size: number = 36, // 기본 크기
  label?: string | number,
  innerCircleColor: string = 'white'
): string => {
  // 테두리와 배경색 설정
  const strokeColor = "white";
  const strokeWidth = 2;
  
  // 레이블 설정
  let labelContent = '';
  if (label) {
    // 숫자 레이블 스타일링
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

  // SVG 원형 마커 생성
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

// 마커 아이콘 옵션 결정 함수
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

  // 마커 타입에 따른 색상과 크기 결정
  if (isItineraryDayPlace) {
    pinColor = (place as ItineraryPlaceWithTime).isFallback ? '#757575' : '#FF5A5F'; // 일정 마커는 빨강, 폴백 마커는 회색
    pinSize = 36; // 일정 마커는 크게
    label = itineraryOrder; // 순서 번호 표시
  } else if (isSelected) {
    pinColor = '#007BFF'; // 선택된 마커는 파랑
    pinSize = 32; // 선택된 마커는 약간 크게
  } else if (isCandidate) {
    pinColor = '#FFA500'; // 후보 마커는 주황
    pinSize = 32;
  } else if (place.category) {
    const categoryKey = mapCategoryNameToKey(place.category);
    pinColor = getCategoryColor(categoryKey); // 카테고리별 색상
    pinSize = 24; // 일반 마커는 작게
  } else {
    pinColor = '#28A745'; // 기본 색상 (초록)
  }

  // 원형 마커 SVG 생성
  const markerContent = createCircleMarkerSvg(pinColor, pinSize, label);
  
  return {
    content: markerContent,
    anchor: { x: pinSize / 2, y: pinSize / 2 }, // 앵커는 원의 중심
    size: { width: pinSize, height: pinSize }
  };
};

// Naver 지도에 마커 생성 함수
export const createNaverMarker = (
  map: any,
  position: any, // naver.maps.LatLng
  iconConfig?: { url?: string; size?: { width: number; height: number }; anchor?: { x: number; y: number }; content?: string },
  title?: string,
  clickable: boolean = true,
  visible: boolean = true,
  zIndex?: number
) => {
  if (!window.naver || !window.naver.maps) {
    console.error("Naver Maps API not initialized when creating marker.");
    return null;
  }
  
  let iconObject: any = null;
  
  // 아이콘 설정
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
                ),
      };
    }
  }

  // 마커 생성 및 반환
  return new window.naver.maps.Marker({
    position: position,
    map: map,
    icon: iconObject,
    title: title,
    clickable: clickable,
    visible: visible,
    zIndex: zIndex,
  });
};

// 마커 배열 생성 함수
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
  
  // 각 장소마다 마커 생성
  places.forEach((place, index) => {
    if (place.y == null || place.x == null) {
        console.warn(`[markerUtils] Place '${place.name}' is missing coordinates (y: ${place.y}, x: ${place.x}) and will be skipped.`);
        return;
    }
    
    const position = createNaverLatLng(place.y, place.x);
    if (!position) return;

    const isSelected = selectedPlace?.id === place.id;
    const isCandidate = candidatePlaces.some(cp => cp.id === place.id);
    
    const iconOptions = getMarkerIconOptions(place, isSelected, isCandidate, false, undefined);
    
    // 마커 Z-index 설정
    const zIndex = isSelected ? 200 : 50;
    const marker = createNaverMarker(map, position, iconOptions, place.name, true, true, zIndex);
    
    // 클릭 이벤트 핸들러 등록
    if (marker && window.naver.maps.Event) {
      window.naver.maps.Event.addListener(marker, 'click', () => {
        onMarkerClick(place, index);
      });
    }
    
    if (marker) markers.push(marker);
  });
  
  return markers;
};
