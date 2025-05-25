
import { useCallback } from 'react';
import type { ItineraryDay } from '@/types/core';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

// 인터페이스 정의로 타입 안전성 확보
interface UseItineraryGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  addPolyline: (path: any[], options: any) => any;
  clearAllMapPolylines: () => void;
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => void;
}

/**
 * 일정 경로 렌더링을 위한 커스텀 훅
 * GeoJSON 기반 경로를 지도에 렌더링합니다.
 */
export const useItineraryGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  addPolyline,
  clearAllMapPolylines,
  updateDayPolylinePaths,
}: UseItineraryGeoJsonRendererProps) => {

  /**
   * 일정 경로를 렌더링하는 함수
   * @param itineraryDay 선택된 일자 일정 데이터
   * @param allServerRoutes 일자별 서버 경로 데이터
   * @param onComplete 렌더링 완료 시 호출될 콜백 함수
   */
  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => {
    // 1. 사전 검증: 지도, 네이버 맵 API, 일정 데이터 확인
    if (!map || !isNaverLoadedParam) {
      console.warn("[useItineraryGeoJsonRenderer] Map not initialized or Naver not loaded.");
      if (onComplete) onComplete();
      return;
    }
    
    // 경로를 그리기 전 기존 경로 초기화
    clearAllMapPolylines();
    
    // 일정이 없으면 초기화만 하고 종료
    if (!itineraryDay) {
      console.log("[useItineraryGeoJsonRenderer] No itinerary day provided, clearing routes.");
      if (onComplete) onComplete();
      return;
    }
    
    const { day, date, dayOfWeek, routeId } = itineraryDay;
    
    // 2. 경로 데이터 준비
    // 2-1. 일자에 해당하는 서버 경로 데이터 확인
    const serverRouteData = allServerRoutes?.[day];
    
    // 2-2. polylinePaths가 있으면 그것을 사용, 없으면 새로 계산
    let polylinePaths: { lat: number; lng: number }[][] = [];
    
    if (serverRouteData?.polylinePaths && serverRouteData.polylinePaths.length > 0) {
      console.log(`[useItineraryGeoJsonRenderer] Using cached polyline paths for day ${day}`);
      polylinePaths = serverRouteData.polylinePaths;
    } else {
      // 2-3. interleaved_route를 기반으로 polyline 경로 생성
      const { interleaved_route } = itineraryDay;
      if (!interleaved_route || interleaved_route.length === 0) {
        console.warn(`[useItineraryGeoJsonRenderer] No interleaved_route found for day ${day}`);
        if (onComplete) onComplete();
        return;
      }
      
      console.log(`[useItineraryGeoJsonRenderer] Rendering route for day ${day} (${dayOfWeek}, ${date}), routeId: ${routeId}, interleaved items: ${interleaved_route.length}`);
      
      // 여기에서 interleaved_route로부터 polyline 경로를 생성하는 로직 추가
      // 실제 구현은 생략 (기존 코드 유지)
      
      // polylinePaths = convertInterleavedRouteToPolylinePaths(interleaved_route);
    }
    
    // 3. 경로 시각화
    // 실제 경로 데이터를 기반으로 polyline 그리기
    if (polylinePaths && polylinePaths.length > 0) {
      console.log(`[useItineraryGeoJsonRenderer] Drawing ${polylinePaths.length} polyline segments for day ${day}`);
      
      polylinePaths.forEach((pathPoints, index) => {
        if (pathPoints.length < 2) return; // 최소 2개 이상의 점이 필요
        
        const naverLatLngs = pathPoints.map(point => {
          return new window.naver.maps.LatLng(point.lat, point.lng);
        });
        
        // 실제 폴리라인 추가
        addPolyline(naverLatLngs, {
          strokeColor: '#2563eb', // 기본 색상 (청색)
          strokeOpacity: 0.8,
          strokeWeight: 5,
        });
      });
      
      // 4. 경로 데이터 캐싱 (필요시)
      if (!serverRouteData?.polylinePaths && polylinePaths.length > 0) {
        updateDayPolylinePaths(day, polylinePaths, itineraryDay);
      }
    } else {
      console.warn(`[useItineraryGeoJsonRenderer] No polyline paths available for day ${day}`);
    }
    
    // 5. 콜백 호출
    if (onComplete) {
      console.log(`[useItineraryGeoJsonRenderer] Route rendering complete for day ${day}`);
      onComplete();
    }
    
  }, [map, isNaverLoadedParam, addPolyline, clearAllMapPolylines, updateDayPolylinePaths]);

  return { renderItineraryRoute };
};
