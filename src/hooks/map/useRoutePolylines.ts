
import { useRef, useCallback } from 'react';

interface UseRoutePolylinesProps {
  map: any;
  isNaverLoadedParam: boolean;
}

/**
 * 경로 폴리라인 관리를 위한 훅
 */
export const useRoutePolylines = ({ 
  map, 
  isNaverLoadedParam 
}: UseRoutePolylinesProps) => {
  // 일반 폴리라인 참조
  const polylinesRef = useRef<any[]>([]);
  // 하이라이트된 폴리라인 참조
  const highlightedPolylineRef = useRef<any | null>(null);

  // 폴리라인 추가 함수
  const addPolyline = useCallback((path: any[], options: any) => {
    if (!map || !isNaverLoadedParam || !window.naver || !window.naver.maps) return null;
    
    const polyline = new window.naver.maps.Polyline({
      map: map,
      path: path,
      strokeColor: options.strokeColor || '#2563eb',
      strokeOpacity: options.strokeOpacity || 0.8,
      strokeWeight: options.strokeWeight || 5,
      strokeStyle: options.strokeStyle || 'solid',
      strokeLineCap: options.strokeLineCap || 'round',
      strokeLineJoin: options.strokeLineJoin || 'round',
      clickable: options.clickable !== undefined ? options.clickable : true,
      visible: options.visible !== undefined ? options.visible : true,
      zIndex: options.zIndex || 1
    });
    
    polylinesRef.current.push(polyline);
    return polyline;
  }, [map, isNaverLoadedParam]);

  // 하이라이트된 폴리라인 설정 함수
  const setHighlightedPolyline = useCallback((path: any[], options: any) => {
    if (!map || !isNaverLoadedParam || !window.naver || !window.naver.maps) return;
    
    // 기존 하이라이트 폴리라인 제거
    clearHighlightedPolyline();
    
    // 새 하이라이트 폴리라인 생성
    const polyline = new window.naver.maps.Polyline({
      map: map,
      path: path,
      strokeColor: options.strokeColor || '#f97316',
      strokeOpacity: options.strokeOpacity || 0.9,
      strokeWeight: options.strokeWeight || 6,
      strokeStyle: options.strokeStyle || 'solid',
      strokeLineCap: options.strokeLineCap || 'round',
      strokeLineJoin: options.strokeLineJoin || 'round',
      clickable: options.clickable !== undefined ? options.clickable : true,
      visible: options.visible !== undefined ? options.visible : true,
      zIndex: options.zIndex || 2 // 다른 폴리라인보다 위에 표시
    });
    
    highlightedPolylineRef.current = polyline;
  }, [map, isNaverLoadedParam]);

  // 하이라이트된 폴리라인 제거 함수
  const clearHighlightedPolyline = useCallback(() => {
    if (highlightedPolylineRef.current) {
      highlightedPolylineRef.current.setMap(null);
      highlightedPolylineRef.current = null;
    }
  }, []);

  // 모든 폴리라인 제거 함수
  const clearAllMapPolylines = useCallback(() => {
    // 일반 폴리라인 제거
    if (polylinesRef.current.length > 0) {
      polylinesRef.current.forEach(polyline => {
        if (polyline) polyline.setMap(null);
      });
      polylinesRef.current = [];
    }
    
    // 하이라이트된 폴리라인 제거
    clearHighlightedPolyline();
    
  }, [clearHighlightedPolyline]);

  return {
    addPolyline,
    setHighlightedPolyline,
    clearHighlightedPolyline,
    clearAllMapPolylines
  };
};
