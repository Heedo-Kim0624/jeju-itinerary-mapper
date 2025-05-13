
import { useCallback } from 'react';
import { ItineraryDay, Place } from '@/types/supabase';

export const useRouteRendering = () => {
  // 전체 경로 계산 및 표시
  const calculateRoutes = useCallback((map: any, places: Place[]) => {
    if (!map || !window.naver || places.length <= 1) return [];

    const polylines: any[] = [];

    // 경로를 나타낼 선 그리기
    for (let i = 0; i < places.length - 1; i++) {
      const currentPlace = places[i];
      const nextPlace = places[i + 1];
      
      if (!currentPlace.x || !currentPlace.y || !nextPlace.x || !nextPlace.y) {
        console.warn('Missing coordinates for route calculation');
        continue;
      }

      const path = [
        new window.naver.maps.LatLng(currentPlace.y, currentPlace.x),
        new window.naver.maps.LatLng(nextPlace.y, nextPlace.x)
      ];

      const polyline = new window.naver.maps.Polyline({
        map: map,
        path: path,
        strokeColor: '#007AFF',
        strokeWeight: 3,
        strokeOpacity: 0.7,
        strokeStyle: 'solid'
      });

      polylines.push(polyline);
    }

    return polylines;
  }, []);

  // 특정 구간 경로 강조
  const highlightRouteSegment = useCallback((map: any, places: Place[], segmentIndex: number) => {
    if (!map || !window.naver || places.length <= 1 || segmentIndex < 0 || segmentIndex >= places.length - 1) {
      return null;
    }

    const currentPlace = places[segmentIndex];
    const nextPlace = places[segmentIndex + 1];
    
    if (!currentPlace?.x || !currentPlace?.y || !nextPlace?.x || !nextPlace?.y) {
      console.warn('Missing coordinates for route highlighting');
      return null;
    }

    const path = [
      new window.naver.maps.LatLng(currentPlace.y, currentPlace.x),
      new window.naver.maps.LatLng(nextPlace.y, nextPlace.x)
    ];

    // 하이라이트된 경로 스타일
    const highlightedPolyline = new window.naver.maps.Polyline({
      map: map,
      path: path,
      strokeColor: '#FF3B30', // 빨간색 강조
      strokeWeight: 6,        // 더 두껍게
      strokeOpacity: 0.9,     // 더 불투명하게
      strokeStyle: 'solid',
      zIndex: 100            // 다른 선보다 위에 표시
    });

    return highlightedPolyline;
  }, []);

  // 지도에 일정 경로 시각화
  const renderItineraryRouteOnMap = useCallback((
    map: any, 
    itineraryDay: ItineraryDay, 
    useGeoJson: boolean = false
  ) => {
    if (!map || !window.naver || !itineraryDay || itineraryDay.places.length <= 1) {
      return [];
    }
    
    console.log(`[useRouteRendering] ${itineraryDay.places.length}개 장소의 일정 경로 렌더링`);
    
    // GeoJSON 경로를 사용하는 경우
    if (useGeoJson) {
      // 노드 ID 기반 경로 탐색 로직은 별도 구현 필요
      console.log('GeoJSON 기반 경로 탐색은 아직 구현되지 않음');
    }
    
    // 일반 직선 경로 그리기
    return calculateRoutes(map, itineraryDay.places);
  }, [calculateRoutes]);

  return {
    calculateRoutes,
    highlightRouteSegment,
    renderItineraryRouteOnMap
  };
};
