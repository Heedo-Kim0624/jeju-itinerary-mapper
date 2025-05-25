
// src/hooks/map/useDayRouteRenderer.ts
import { useCallback, useState } from 'react';
import type { ItineraryDay } from '@/types/supabase';
import { ROUTE_COLORS, calculateDistance, ItineraryRouteOptions } from '@/utils/map/itineraryRoutingUtils';
import { toast } from 'sonner';

interface UseDayRouteRendererProps {
  map: any;
  addMainRoutePolyline: (polyline: any) => void;
  clearAllPolylines: () => void;
  mainRoutePolylinesRef: React.MutableRefObject<any[]>; // To update currentRoutes for highlightSegment
}

export const useDayRouteRenderer = ({ map, addMainRoutePolyline, clearAllPolylines, mainRoutePolylinesRef }: UseDayRouteRendererProps) => {
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [lastRenderedDay, setLastRenderedDay] = useState<number | null>(null);
  // This state mimics the old `currentRoutes` state, used by the highlighter.
  const [currentDayMainPolyline, setCurrentDayMainPolyline] = useState<any|null>(null);


  const renderDayRoute = useCallback((itineraryDay: ItineraryDay | null, options?: ItineraryRouteOptions) => {
    if (!map || !window.naver || !itineraryDay || itineraryDay.places.length < 2) {
      console.log("경로를 그릴 수 없습니다 (useDayRouteRenderer):", {
        맵존재: !!map, 
        네이버존재: !!window.naver, 
        일정존재: !!itineraryDay,
        장소개수: itineraryDay?.places?.length
      });
      setCurrentDayMainPolyline(null);
      mainRoutePolylinesRef.current = [];
      return;
    }

    clearAllPolylines();
    
    try {
      const pathPoints = itineraryDay.places.map(place => {
        if (typeof place.y !== 'number' || typeof place.x !== 'number') {
            console.warn(`Invalid coordinates for place ${place.name} in renderDayRoute`);
            return null;
        }
        return new window.naver.maps.LatLng(place.y, place.x);
      }).filter(p => p !== null);

      if (pathPoints.length < 2) {
        console.warn("Not enough valid points to draw route in renderDayRoute");
        setCurrentDayMainPolyline(null);
        mainRoutePolylinesRef.current = [];
        return;
      }
      
      const dayIndex = (itineraryDay.day - 1) % ROUTE_COLORS.length;
      const strokeColor = options?.strokeColor || ROUTE_COLORS[dayIndex];
      
      const mainPolyline = new window.naver.maps.Polyline({
        map: map,
        path: pathPoints,
        strokeColor: strokeColor,
        strokeWeight: options?.strokeWeight || 5,
        strokeOpacity: options?.strokeOpacity || 0.7,
        strokeStyle: options?.strokeStyle || 'solid',
        zIndex: options?.zIndex || 100,
      });
      
      addMainRoutePolyline(mainPolyline);
      setCurrentDayMainPolyline(mainPolyline); // Store the main polyline for this day
      
      let calculatedTotalDist = 0;
      for (let i = 0; i < itineraryDay.places.length - 1; i++) {
        const current = itineraryDay.places[i];
        const next = itineraryDay.places[i + 1];
        
        if (current.x && current.y && next.x && next.y) {
          const segmentDist = calculateDistance(current.y, current.x, next.y, next.x);
          calculatedTotalDist += segmentDist;
        }
      }
      
      setTotalDistance(calculatedTotalDist);
      setLastRenderedDay(itineraryDay.day);
      
      console.log(`[useDayRouteRenderer] ${itineraryDay.day}일차 경로가 성공적으로 렌더링되었습니다. (${itineraryDay.places.length}개 장소, 총 거리: ${calculatedTotalDist.toFixed(2)}km)`);
      toast.success(`${itineraryDay.day}일차 경로가 지도에 표시되었습니다.`);
      
    } catch (error) {
      console.error("[useDayRouteRenderer] 경로 렌더링 중 오류 발생:", error);
      toast.error("경로 표시 중 오류가 발생했습니다.");
      setCurrentDayMainPolyline(null);
      mainRoutePolylinesRef.current = [];
    }
  }, [map, addMainRoutePolyline, clearAllPolylines, mainRoutePolylinesRef]);

  return {
    renderDayRoute,
    totalDistance,
    lastRenderedDay,
    currentDayMainPolyline, // This is needed for the highlighter
  };
};
