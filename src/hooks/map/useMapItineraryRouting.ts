
import { useCallback, useRef, useState, useEffect } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import { clearPolylines } from '@/utils/map/mapCleanup';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';

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
  const [totalDistance, setTotalDistance] = useState<number>(0);

  // 모든 경로 초기화
  const clearAllRoutes = useCallback(() => {
    if (polylines.current.length > 0) {
      clearPolylines(polylines.current);
      polylines.current = [];
    }
  }, []);

  // 두 좌표 사이의 거리 계산 (km)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
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
      let calculatedDistance = 0;
      
      // 카테고리별로 경로를 다르게 표시
      const placesByCategory: Record<string, Place[]> = {};
      itineraryDay.places.forEach(place => {
        const category = place.category || 'default';
        if (!placesByCategory[category]) {
          placesByCategory[category] = [];
        }
        placesByCategory[category].push(place);
      });
      
      // 전체 순서대로 경로 생성 (기본 경로)
      const pathPoints = itineraryDay.places.map(place => {
        return new window.naver.maps.LatLng(place.y, place.x);
      });
      
      // 날짜에 따라 다른 색상 사용
      const dayIndex = (itineraryDay.day - 1) % ROUTE_COLORS.length;
      const strokeColor = options?.strokeColor || ROUTE_COLORS[dayIndex];
      
      // 경로 폴리라인 생성 (기본 경로)
      const mainPolyline = new window.naver.maps.Polyline({
        map: map,
        path: pathPoints,
        strokeColor: strokeColor,
        strokeWeight: options?.strokeWeight || 5,
        strokeOpacity: options?.strokeOpacity || 0.7,
        strokeStyle: options?.strokeStyle || 'solid',
        zIndex: options?.zIndex || 100,
      });
      
      polylines.current.push(mainPolyline);
      
      // 각 구간별 거리 계산
      let totalDist = 0;
      for (let i = 0; i < itineraryDay.places.length - 1; i++) {
        const current = itineraryDay.places[i];
        const next = itineraryDay.places[i + 1];
        
        if (current.x && current.y && next.x && next.y) {
          const segmentDist = calculateDistance(current.y, current.x, next.y, next.x);
          totalDist += segmentDist;
        }
      }
      
      setTotalDistance(totalDist);
      
      console.log(`${itineraryDay.day}일차 경로가 성공적으로 렌더링되었습니다. (${itineraryDay.places.length}개 장소, 총 거리: ${totalDist.toFixed(2)}km)`);
      
      return () => clearPolylines([mainPolyline]);
    } catch (error) {
      console.error("경로 렌더링 중 오류 발생:", error);
    }
  }, [map, calculateDistance, clearAllRoutes]);

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
  }, [map, clearAllRoutes]);

  return {
    renderDayRoute,
    renderMultiDayRoutes,
    clearAllRoutes,
    totalDistance
  };
};
