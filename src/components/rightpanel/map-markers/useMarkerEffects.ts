
import { useCallback } from 'react';
import { Place } from '@/types/supabase';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';

export interface MarkerOptions {
  highlight?: boolean;
  isItinerary?: boolean;
  useRecommendedStyle?: boolean;
  useColorByCategory?: boolean;
  onClick?: (place: Place, index: number) => void;
}

export const useMarkerEffects = () => {
  // 마커 스타일 생성
  const createMarkerStyle = useCallback((
    place: Place, 
    index: number, 
    options: MarkerOptions
  ) => {
    const { highlight = false, isItinerary = false, useRecommendedStyle = false, useColorByCategory = false } = options;
    
    // 장소 카테고리에 따른 색상 결정
    const categoryColor = useColorByCategory && place.category 
      ? getCategoryColor(mapCategoryNameToKey(place.category)) 
      : (highlight ? '#FF3B30' : '#4CD964');

    let markerIcon;

    // 마커 스타일 결정
    if (isItinerary) {
      // 일정 마커는 순서 번호가 포함된 원형 마커
      markerIcon = createNumberMarker(index, categoryColor);
    } else if (useRecommendedStyle) {
      // 추천 장소 마커 스타일
      markerIcon = createStarMarker(categoryColor);
    } else {
      // 기본 마커 스타일
      markerIcon = createDotMarker(categoryColor);
    }
    
    return {
      markerIcon,
      zIndex: highlight ? 100 : isItinerary ? 90 - index : 50
    };
  }, []);

  // 숫자 마커 스타일 (일정용)
  const createNumberMarker = (index: number, color: string) => {
    if (!window.naver) return null;
    
    return {
      content: `
        <div class="custom-marker" style="
          width: 36px; height: 36px; border-radius: 50%; 
          background-color: ${color};
          color: white; font-weight: bold; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white;
          font-size: 14px;
        ">${index + 1}</div>
      `,
      size: new window.naver.maps.Size(36, 36),
      anchor: new window.naver.maps.Point(18, 18)
    };
  };

  // 별표 마커 스타일 (추천 장소용)
  const createStarMarker = (color: string) => {
    if (!window.naver) return null;
    
    return {
      content: `
        <div class="custom-marker" style="
          width: 32px; height: 32px; border-radius: 50%;
          background-color: ${color};
          color: white; font-weight: bold; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white;
          font-size: 12px; display: flex; align-items: center; justify-content: center;
        ">⭐</div>
      `,
      size: new window.naver.maps.Size(32, 32),
      anchor: new window.naver.maps.Point(16, 16)
    };
  };

  // 점 마커 스타일 (기본)
  const createDotMarker = (color: string) => {
    if (!window.naver) return null;
    
    return {
      content: `
        <div class="custom-marker" style="
          width: 24px; height: 24px; border-radius: 50%;
          background-color: ${color};
          border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      size: new window.naver.maps.Size(24, 24),
      anchor: new window.naver.maps.Point(12, 12)
    };
  };
  
  // 정보창 내용 생성
  const createInfoWindowContent = useCallback((place: Place, index: number, isItinerary: boolean, categoryColor: string) => {
    return `
      <div style="padding: 10px; max-width: 200px; font-size: 13px;">
        <h3 style="font-weight: bold; margin-bottom: 5px;">${place.name}</h3>
        ${place.address ? `<p style="color: #666; margin: 4px 0;">${place.address}</p>` : ''}
        ${place.category ? `<p style="color: ${categoryColor}; margin: 4px 0; font-size: 12px;">${place.category}</p>` : ''}
        ${place.rating ? `<p style="color: #FF9500; margin: 4px 0;">⭐ ${place.rating.toFixed(1)}</p>` : ''}
        ${isItinerary ? `<strong style="color: ${categoryColor}; font-size: 14px;">방문 순서: ${index + 1}</strong>` : ''}
      </div>
    `;
  }, []);

  return {
    createMarkerStyle,
    createInfoWindowContent
  };
};
