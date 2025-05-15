
import { useCallback, useRef } from 'react';
import { Place } from '@/types/supabase';
import { ServerRouteResponse, ExtractedRouteData } from '@/types/schedule';
import { ItineraryDay } from '@/hooks/use-itinerary-creator';

/**
 * 지도 특성(마커, 경로 등) 관리 훅
 */
export const useMapFeatures = (map: any) => {
  // 노드 ID로부터 링크 ID 추출 (서버 응답 형식에 따라 조정 필요)
  const extractNodeAndLinkIds = useCallback((response: ServerRouteResponse): ExtractedRouteData => {
    // 서버가 이미 linkIds를 제공하는 경우
    if (response.linkIds && response.linkIds.length > 0) {
      return {
        nodeIds: response.nodeIds.map(id => id.toString()),
        linkIds: response.linkIds.map(id => id.toString())
      };
    }
    
    // linkIds가 없는 경우, nodeIds에서 추출 시도
    const nodeIds = response.nodeIds.map(id => id.toString());
    return {
      nodeIds,
      linkIds: [] // 서버 응답 형식에 따라 구현 필요
    };
  }, []);

  // 하이라이트된 경로 참조
  const highlightedPathRef = useRef<any[]>([]);

  // 이전 하이라이트된 경로 제거
  const clearPreviousHighlightedPath = useCallback(() => {
    if (highlightedPathRef.current && highlightedPathRef.current.length > 0) {
      highlightedPathRef.current.forEach(feature => {
        if (feature && typeof feature.setMap === 'function') {
          feature.setMap(null);
        }
      });
      highlightedPathRef.current = [];
    }
  }, []);

  // GeoJSON 노드와 링크를 사용하여 경로 렌더링
  const renderGeoJsonRoute = useCallback((nodeIds: string[], linkIds: string[], style: any = {}): any[] => {
    if (!map || !window.geoJsonLayer || typeof window.geoJsonLayer.renderRoute !== 'function') {
      console.warn('GeoJSON 렌더링 레이어를 찾을 수 없습니다.');
      return [];
    }
    
    return window.geoJsonLayer.renderRoute(nodeIds, linkIds, style);
  }, [map]);

  // 특정 장소 인덱스의 경로 하이라이트
  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay) => {
    if (!map || !itineraryDay || !itineraryDay.places) return;
    
    // 인덱스 유효성 검사
    if (placeIndex <= 0 || placeIndex >= itineraryDay.places.length) {
      console.log('유효하지 않은 장소 인덱스:', placeIndex);
      return;
    }
    
    const fromIndex = placeIndex - 1;
    const toIndex = placeIndex;
    
    // 서버 경로 데이터 확인
    // 구현 필요: 서버 데이터에서 특정 구간에 해당하는 노드/링크 추출
    
    // 기존 하이라이트 제거
    clearPreviousHighlightedPath();
    
    console.log(`${fromIndex + 1}에서 ${toIndex + 1}까지의 경로 하이라이트`);
    
    // 임시 하이라이트 색상 처리
    // 실제 구현에서는 서버 데이터에서 추출된 nodeIds와 linkIds로 대체 필요
    if (window.geoJsonLayer) {
      const renderedFeatures = window.geoJsonLayer.renderRoute(
        [], // 실제 nodeIds로 대체 필요
        [], // 실제 linkIds로 대체 필요
        {
          strokeColor: '#FF3B30',
          strokeWeight: 6,
          strokeOpacity: 0.9,
          zIndex: 200
        }
      );
      
      highlightedPathRef.current = renderedFeatures;
      
      // 3초 후 하이라이트 제거
      setTimeout(() => {
        clearPreviousHighlightedPath();
      }, 3000);
    }
  }, [map, clearPreviousHighlightedPath, renderGeoJsonRoute]);

  // 일정 경로 렌더링 함수 - 서버 데이터 활용
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null) => {
    if (!map || !itineraryDay) {
      return;
    }
    
    // 기존 경로 삭제
    clearPreviousHighlightedPath();
    
    // GeoJSON 기반 라우팅인지 확인
    if (window.geoJsonLayer) {
      console.log('경로 렌더링 시도:', {
        일자: itineraryDay.day
      });
      
      // 전체 네트워크 렌더링 (임시 코드)
      if (typeof window.geoJsonLayer.renderAllNetwork === 'function') {
        window.geoJsonLayer.renderAllNetwork({
          strokeColor: '#3366FF',
          strokeWeight: 3,
          strokeOpacity: 0.6
        });
      }
    }
  }, [map, clearPreviousHighlightedPath]);
  
  // 전체 네트워크 렌더링 함수
  const renderAllNetwork = useCallback((style: any = {}) => {
    if (!map || !window.geoJsonLayer) return [];
    
    if (typeof window.geoJsonLayer.renderAllNetwork === 'function') {
      return window.geoJsonLayer.renderAllNetwork(style);
    }
    return [];
  }, [map]);

  return {
    renderGeoJsonRoute,
    renderItineraryRoute,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    extractNodeAndLinkIds,
    renderAllNetwork
  };
};
