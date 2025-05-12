
import { useCallback, useRef } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import { clearPolylines } from '@/utils/map/mapCleanup';

// 날짜별 경로 색상 팔레트
const ROUTE_COLORS = [
  '#9b87f5', // Primary Purple
  '#F97316', // Bright Orange
  '#0EA5E9', // Ocean Blue
  '#D946EF', // Magenta Pink
  '#ea384c', // Red
  '#33C3F0', // Sky Blue
  '#8B5CF6'  // Vivid Purple
];

interface ItineraryRouteOptions {
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeColor?: string;
  strokeStyle?: 'solid' | 'dashed';
  zIndex?: number;
}

export const useMapItineraryRouting = (map: any) => {
  const polylines = useRef<any[]>([]);

  // 모든 경로 초기화
  const clearAllRoutes = useCallback(() => {
    if (polylines.current.length > 0) {
      clearPolylines(polylines.current);
      polylines.current = [];
    }
  }, []);

  // 일정 날짜에 해당하는 경로 그리기
  const renderDayRoute = useCallback((itineraryDay: ItineraryDay | null, options?: ItineraryRouteOptions) => {
    if (!map || !window.naver || !itineraryDay || itineraryDay.places.length < 2) {
      console.log("경로를 그릴 수 없습니다:", {
        맵존재: !!map, 
        네이버존재: !!window.naver, 
        일정존재: !!itineraryDay,
        장소개수: itineraryDay?.places?.length
      });
      return;
    }

    // 기존 경로 삭제
    clearAllRoutes();
    
    try {
      // 일정의 장소들로 경로 생성
      const pathPoints = itineraryDay.places.map(place => {
        return new window.naver.maps.LatLng(place.y, place.x);
      });
      
      // 날짜에 따라 다른 색상 사용
      const dayIndex = (itineraryDay.day - 1) % ROUTE_COLORS.length;
      const strokeColor = options?.strokeColor || ROUTE_COLORS[dayIndex];
      
      // 경로 폴리라인 생성
      const polyline = new window.naver.maps.Polyline({
        map: map,
        path: pathPoints,
        strokeColor: strokeColor,
        strokeWeight: options?.strokeWeight || 5,
        strokeOpacity: options?.strokeOpacity || 0.7,
        strokeStyle: options?.strokeStyle || 'solid',
        zIndex: options?.zIndex || 100,
      });
      
      // 참조에 저장하여 나중에 제거할 수 있도록 함
      polylines.current.push(polyline);
      
      console.log(`${itineraryDay.day}일차 경로가 성공적으로 렌더링되었습니다. (${itineraryDay.places.length}개 장소)`);
      
      return () => clearPolylines([polyline]);
    } catch (error) {
      console.error("경로 렌더링 중 오류 발생:", error);
    }
  }, [map]);

  // 여러 일정에 대한 경로 한번에 그리기 (옵션)
  const renderMultiDayRoutes = useCallback((itinerary: ItineraryDay[] | null) => {
    if (!map || !window.naver || !itinerary || itinerary.length === 0) {
      return;
    }

    // 기존 경로 삭제
    clearAllRoutes();
    
    try {
      itinerary.forEach((day, index) => {
        if (day.places.length < 2) return;
        
        const pathPoints = day.places.map(place => 
          new window.naver.maps.LatLng(place.y, place.x)
        );
        
        const dayIndex = index % ROUTE_COLORS.length;
        
        const polyline = new window.naver.maps.Polyline({
          map: map,
          path: pathPoints,
          strokeColor: ROUTE_COLORS[dayIndex],
          strokeWeight: 5,
          strokeOpacity: 0.7,
          strokeStyle: 'solid',
          zIndex: 100 - index, // 앞쪽 일정이 위에 표시되도록
        });
        
        polylines.current.push(polyline);
      });
      
      console.log(`총 ${itinerary.length}일 경로가 렌더링되었습니다.`);
      
    } catch (error) {
      console.error("다중 경로 렌더링 중 오류 발생:", error);
    }
  }, [map]);

  return {
    renderDayRoute,
    renderMultiDayRoutes,
    clearAllRoutes
  };
};
