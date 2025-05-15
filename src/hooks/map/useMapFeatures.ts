
import { useCallback, useRef } from 'react';
import { Place } from '@/types/supabase';
import { ServerRouteResponse } from '@/types/schedule';
import { ItineraryDay } from '@/hooks/use-itinerary-creator';

// Define ExtractedRouteData interface locally
interface ExtractedRouteData {
  nodeIds: string[];
  linkIds: string[];
}

/**
 * 지도 특성(마커, 경로 등) 관리 훅
 */
export const useMapFeatures = (map: any) => {
  // 노드 ID로부터 링크 ID 추출 (서버 응답 형식에 따라 조정 필요)
  const extractNodeAndLinkIds = useCallback((response: ServerRouteResponse): ExtractedRouteData => {
    console.log("서버로부터 받은 경로 데이터:", response);
    
    // 서버가 이미 linkIds를 제공하는 경우
    if (response.linkIds && response.linkIds.length > 0) {
      console.log("서버에서 제공한 linkIds 사용:", response.linkIds.length);
      return {
        nodeIds: response.nodeIds.map(id => id.toString()),
        linkIds: response.linkIds.map(id => id.toString())
      };
    }
    
    // linkIds가 없는 경우, nodeIds에서 추출
    const nodeIds = response.nodeIds.map(id => id.toString());
    console.log("nodeIds에서 링크 추출 시도:", nodeIds.length);
    
    // 단순 예시: 짝수 인덱스 = 노드, 홀수 인덱스 = 링크
    // 실제로는 서버 응답 형식에 맞게 커스터마이즈 필요
    const extractedLinkIds = nodeIds.filter((_, i) => i % 2 === 1);
    const extractedNodeIds = nodeIds.filter((_, i) => i % 2 === 0);
    
    console.log("추출 결과:", {
      extractedNodeIds: extractedNodeIds.length,
      extractedLinkIds: extractedLinkIds.length
    });
    
    return {
      nodeIds: extractedNodeIds,
      linkIds: extractedLinkIds
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
    
    console.log("GeoJSON 경로 렌더링:", {
      nodeIds: nodeIds.length > 0 ? `${nodeIds[0]}... 외 ${nodeIds.length-1}개` : "없음",
      linkIds: linkIds.length > 0 ? `${linkIds[0]}... 외 ${linkIds.length-1}개` : "없음"
    });
    
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
    
    // 기존 하이라이트 제거
    clearPreviousHighlightedPath();
    
    console.log(`${fromIndex + 1}에서 ${toIndex + 1}까지의 경로 하이라이트`);
    
    // 서버 경로 데이터가 있는지 확인
    if (itineraryDay.routeData && 
        window.geoJsonLayer && 
        typeof window.geoJsonLayer.renderRoute === 'function') {
      
      // 경로 데이터에서 해당 구간 추출 필요
      // 일단 전체 경로 렌더링
      const renderedFeatures = window.geoJsonLayer.renderRoute(
        itineraryDay.routeData.nodeIds.map(id => id.toString()) || [], 
        itineraryDay.routeData.linkIds?.map(id => id.toString()) || [],
        {
          strokeColor: '#FF3B30',
          strokeWeight: 6,
          strokeOpacity: 0.9,
          zIndex: 200
        }
      );
      
      highlightedPathRef.current = renderedFeatures;
    } else {
      console.log("경로 데이터가 없거나 GeoJSON 레이어가 초기화되지 않았습니다");
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
        일자: itineraryDay.day,
        routeData: itineraryDay.routeData ? "있음" : "없음"
      });
      
      // 서버에서 받은 경로 데이터가 있는 경우
      if (itineraryDay.routeData) {
        console.log("서버에서 제공한 경로 데이터 사용:", {
          nodeIds: itineraryDay.routeData.nodeIds.length,
          linkIds: itineraryDay.routeData.linkIds ? itineraryDay.routeData.linkIds.length : "없음"
        });
        
        // 노드/링크 ID를 문자열로 변환
        const nodeIds = itineraryDay.routeData.nodeIds.map(id => id.toString());
        const linkIds = itineraryDay.routeData.linkIds ? 
                       itineraryDay.routeData.linkIds.map(id => id.toString()) : 
                       [];
        
        if (typeof window.geoJsonLayer.renderRoute === 'function') {
          // 전체 경로를 파란색으로 표시
          const renderedFeatures = window.geoJsonLayer.renderRoute(nodeIds, linkIds, {
            strokeColor: '#3366FF',
            strokeWeight: 5,
            strokeOpacity: 0.8,
            zIndex: 150
          });
          
          highlightedPathRef.current = renderedFeatures;
        }
        
        return;
      }
      
      // 경로 데이터가 없는 경우, 전체 네트워크를 표시 (디버깅 용도)
      if (typeof window.geoJsonLayer.renderAllNetwork === 'function') {
        console.log("전체 네트워크 표시 시도 (경로 데이터 없음)");
        const renderedFeatures = window.geoJsonLayer.renderAllNetwork({
          strokeColor: '#3366FF',
          strokeWeight: 3,
          strokeOpacity: 0.6,
          zIndex: 100
        });
        
        highlightedPathRef.current = renderedFeatures;
      }
    }
  }, [map, clearPreviousHighlightedPath]);
  
  // 전체 네트워크 렌더링 함수
  const renderAllNetwork = useCallback((style: any = {}) => {
    if (!map || !window.geoJsonLayer) {
      console.warn("Map or geoJsonLayer not initialized");
      return [];
    }
    
    if (typeof window.geoJsonLayer.renderAllNetwork === 'function') {
      console.log("전체 네트워크 렌더링");
      return window.geoJsonLayer.renderAllNetwork(style);
    }
    
    console.warn("renderAllNetwork function not available");
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
