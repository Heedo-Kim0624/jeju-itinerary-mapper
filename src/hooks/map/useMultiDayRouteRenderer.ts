
// src/hooks/map/useMultiDayRouteRenderer.ts
import { useCallback } from 'react';
import type { ItineraryDay } from '@/types/supabase';
import { ROUTE_COLORS } from '@/utils/map/itineraryRoutingUtils';

interface UseMultiDayRouteRendererProps {
  map: any;
  addMainRoutePolyline: (polyline: any) => void;
  clearAllPolylines: () => void;
}

export const useMultiDayRouteRenderer = ({ map, addMainRoutePolyline, clearAllPolylines }: UseMultiDayRouteRendererProps) => {
  const renderMultiDayRoutes = useCallback((itinerary: ItineraryDay[] | null) => {
    if (!map || !window.naver || !itinerary || itinerary.length === 0) {
      return;
    }

    clearAllPolylines();
    
    try {
      itinerary.forEach((day, index) => {
        if (day.places.length < 2) return;
        
        const pathPoints = day.places.map(place => {
          if (typeof place.y !== 'number' || typeof place.x !== 'number') {
            console.warn(`Invalid coordinates for place ${place.name} in multi-day route`);
            return null;
          }
          return new window.naver.maps.LatLng(place.y, place.x);
        }).filter(p => p !== null);

        if (pathPoints.length < 2) {
          console.warn(`Not enough valid points for day ${day.day} in multi-day route`);
          return;
        }
        
        const dayIndex = index % ROUTE_COLORS.length;
        
        const polyline = new window.naver.maps.Polyline({
          map: map,
          path: pathPoints,
          strokeColor: ROUTE_COLORS[dayIndex],
          strokeWeight: 5,
          strokeOpacity: 0.7,
          strokeStyle: 'solid',
          zIndex: 100 - index, 
        });
        
        addMainRoutePolyline(polyline);
      });
      
      console.log(`[useMultiDayRouteRenderer] 총 ${itinerary.length}일 경로가 렌더링되었습니다.`);
      
    } catch (error) {
      console.error("[useMultiDayRouteRenderer] 다중 경로 렌더링 중 오류 발생:", error);
    }
  }, [map, addMainRoutePolyline, clearAllPolylines]);

  return { renderMultiDayRoutes };
};
