
// src/hooks/map/useItinerarySegmentHighlighter.ts
import { useCallback } from 'react';
import type { ItineraryDay } from '@/types/supabase';

interface UseItinerarySegmentHighlighterProps {
  map: any;
  addTemporaryPolyline: (polyline: any) => void;
  removeTemporaryPolyline: (polyline: any) => void;
  clearTemporaryPolylines: () => void;
  currentDayMainPolyline: any | null; // The main polyline from the day route renderer
}

export const useItinerarySegmentHighlighter = ({
  map,
  addTemporaryPolyline,
  removeTemporaryPolyline,
  clearTemporaryPolylines,
  currentDayMainPolyline,
}: UseItinerarySegmentHighlighterProps) => {
  const highlightItinerarySegment = useCallback((fromIndex: number, toIndex: number, itineraryDay: ItineraryDay) => {
    if (!map || !window.naver || !itineraryDay || !itineraryDay.places) {
      console.error("[Highlighter] 세그먼트 하이라이트 실패: 필수 데이터 누락");
      return null;
    }
    
    try {
      const places = itineraryDay.places;
      if (fromIndex < 0 || fromIndex >= places.length || toIndex < 0 || toIndex >= places.length) {
        console.error("[Highlighter] 유효하지 않은 장소 인덱스:", fromIndex, toIndex);
        return null;
      }
      
      clearTemporaryPolylines(); // Clear previous temporary highlights
      
      const source = places[fromIndex];
      const target = places[toIndex];
      
      if (!source.x || !source.y || !target.x || !target.y) {
        console.error("[Highlighter] 장소에 좌표 정보가 없습니다");
        return null;
      }
      
      const segmentPath = [
        new window.naver.maps.LatLng(source.y, source.x),
        new window.naver.maps.LatLng(target.y, target.x)
      ];
      
      const highlightLine = new window.naver.maps.Polyline({
        map: map,
        path: segmentPath,
        strokeColor: '#FF0000',
        strokeWeight: 8,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        zIndex: 200,
      });
      
      addTemporaryPolyline(highlightLine);
      
      setTimeout(() => {
        removeTemporaryPolyline(highlightLine);
      }, 3000);
      
      const bounds = new window.naver.maps.LatLngBounds(
        new window.naver.maps.LatLng(source.y, source.x),
        new window.naver.maps.LatLng(target.y, target.x)
      );
      map.fitBounds(bounds, { padding: 100 });
      
      return highlightLine; // Return for potential external management if needed
    } catch (error) {
      console.error("[Highlighter] 경로 구간 하이라이트 오류:", error);
      return null;
    }
  }, [map, addTemporaryPolyline, removeTemporaryPolyline, clearTemporaryPolylines, currentDayMainPolyline]);

  return { highlightItinerarySegment };
};
