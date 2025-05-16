
import { useCallback, useRef } from 'react';
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { ServerRouteResponse, ExtractedRouteData } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute, parseInterleavedRoute } from '@/utils/routeParser';

/**
 * 지도 특성(마커, 경로 등) 관리 훅
 */
export const useMapFeatures = (map: any) => {
  // 노드 ID로부터 링크 ID 추출 (서버 응답 형식에 따라 조정 필요)
  const extractNodeAndLinkIds = useCallback((response: ServerRouteResponse): ExtractedRouteData => {
    // This function might be less relevant if interleaved_route is primary
    if (response.linkIds && response.linkIds.length > 0 && response.nodeIds && response.nodeIds.length > 0) {
      return {
        nodeIds: response.nodeIds.map(id => id.toString()),
        linkIds: response.linkIds.map(id => id.toString())
      };
    }
    if (response.interleaved_route && response.interleaved_route.length > 0) {
        return {
            nodeIds: extractAllNodesFromRoute(response.interleaved_route).map(String),
            linkIds: extractAllLinksFromRoute(response.interleaved_route).map(String),
        }
    }
    return { nodeIds: [], linkIds: [] };
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

  // GeoJSON 노드와 링크를 사용하여 경로 렌더링 (기존 함수 활용)
  const renderGeoJsonRoute = useCallback((nodeIds: string[], linkIds: string[], style: any = {}): any[] => {
    if (!map || !window.geoJsonLayer || typeof window.geoJsonLayer.renderRoute !== 'function') {
      console.warn('GeoJSON 렌더링 레이어를 찾을 수 없습니다. (useMapFeatures)');
      return [];
    }
    console.log(`[useMapFeatures] Rendering GeoJSON route with ${nodeIds.length} nodes, ${linkIds.length} links.`);
    return window.geoJsonLayer.renderRoute(nodeIds, linkIds, style);
  }, [map]);

  // 일정 경로 렌더링 함수 - 서버 데이터 활용 (interleaved_route 우선)
  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null, 
    serverRoutesData: Record<number, ServerRouteResponse>, // 이 인자는 이제 itineraryDay.interleaved_route로 대체 가능
    renderDayRouteFallback: (day: ItineraryDay) => void, // 기존 폴백 함수
    clearAllRoutes: () => void
  ) => {
    if (!map || !itineraryDay) {
      clearAllRoutes();
      return;
    }
    
    clearAllRoutes();
    
    const dayData = itineraryDay; 

    // interleaved_route 우선 사용
    if (window.geoJsonLayer && dayData.interleaved_route && dayData.interleaved_route.length > 0) {
      console.log(`[useMapFeatures] 서버 기반 GeoJSON 경로 렌더링 시도 (interleaved): 일자 ${dayData.day}`);
      
      const nodeIds = extractAllNodesFromRoute(dayData.interleaved_route).map(String);
      const linkIds = extractAllLinksFromRoute(dayData.interleaved_route).map(String);
      
      console.log("🗺️ [useMapFeatures] 시각화 대상 노드/링크 ID (interleaved):", { nodeIds, linkIds });

      renderGeoJsonRoute(
        nodeIds, 
        linkIds,
        {
          fillColor: '#FF0000', // 장소 노드 마커: 빨간색
          strokeColor: '#90EE90', // 경로 링크: 연두색
          strokeWeight: 5,
          strokeOpacity: 0.8,
          zIndex: 100 // 기본 zIndex 설정
        }
      );
      return;
    } else if (window.geoJsonLayer && dayData.routeData?.nodeIds && dayData.routeData?.linkIds) {
      // 기존 nodeIds, linkIds 방식 (폴백)
      console.log(`[useMapFeatures] 서버 기반 GeoJSON 경로 렌더링 시도 (nodeIds/linkIds): 일자 ${dayData.day}`);
      renderGeoJsonRoute(
        dayData.routeData.nodeIds,
        dayData.routeData.linkIds,
        {
          fillColor: '#FF0000', // 장소 노드 마커: 빨간색
          strokeColor: '#FFA500', // 경로 링크: 주황색 (폴백 시각화용)
          strokeWeight: 5,
          strokeOpacity: 0.7,
          zIndex: 100
        }
      );
      return;
    }
    
    // 폴백: Naver Polyline 직접 사용 (renderDayRouteFallback)
    console.warn(`[useMapFeatures] GeoJSON 경로 데이터 부족, 폴백 경로 렌더링: 일자 ${dayData.day}`);
    renderDayRouteFallback(itineraryDay);
  }, [map, renderGeoJsonRoute]);
  
  // 특정 장소 인덱스의 경로 하이라이트
  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay, serverRoutesData: Record<number, ServerRouteResponse>) => {
    if (!map || !itineraryDay || !itineraryDay.places || !window.geoJsonLayer) return;
    
    if (placeIndex < 0 || placeIndex >= itineraryDay.places.length) {
      console.log('유효하지 않은 장소 인덱스:', placeIndex);
      return;
    }

    // 기존 하이라이트 제거
    clearPreviousHighlightedPath();

    if (itineraryDay.interleaved_route) {
        const parsedSegments = parseInterleavedRoute(itineraryDay.interleaved_route);
        if (placeIndex === 0) return; 

        const targetSegmentIndex = placeIndex -1;
        if (targetSegmentIndex < parsedSegments.length) {
            const segment = parsedSegments[targetSegmentIndex];
            // segment.from, segment.to는 노드 ID, segment.links는 링크 ID 배열
            const segmentNodes = [String(segment.from), String(segment.to)]; 
            // interleaved_route의 구조에 따라 segment.links가 중간 노드를 포함할 수 있으므로,
            // 정확한 노드/링크 추출은 extractAllNodesFromRoute/extractAllLinksFromRoute 사용 고려
            const fullSegmentRoute = [segment.from, ...segment.links, segment.to].filter(id => id !== null && id !== undefined);
            const nodesForSegment = extractAllNodesFromRoute(fullSegmentRoute).map(String);
            const linksForSegment = extractAllLinksFromRoute(fullSegmentRoute).map(String);
            
            console.log(`${itineraryDay.places[placeIndex-1]?.name || '이전 장소'}에서 ${itineraryDay.places[placeIndex]?.name || '현재 장소'}까지의 경로 하이라이트`);
            const renderedFeatures = renderGeoJsonRoute(
                nodesForSegment, // 정확히 추출된 노드
                linksForSegment, // 정확히 추출된 링크
                { 
                  fillColor: '#FF3B30', // 하이라이트 노드 색상 (기존과 동일 또는 변경 가능)
                  strokeColor: '#FF3B30', // 하이라이트 경로 색상
                  strokeWeight: 6, 
                  strokeOpacity: 0.9, 
                  zIndex: 200 // 더 높은 zIndex로 위에 표시
                }
            );
            highlightedPathRef.current = renderedFeatures;

            setTimeout(() => {
                clearPreviousHighlightedPath();
            }, 3000);
        } else {
            console.warn(`세그먼트 인덱스 ${targetSegmentIndex}가 범위를 벗어났습니다. (세그먼트 수: ${parsedSegments.length})`);
        }
    } else {
        // Fallback if no interleaved_route
        console.warn("interleaved_route가 없어 구간 하이라이트를 할 수 없습니다.");
        const serverRouteData = serverRoutesData[itineraryDay.day];
        if (serverRouteData) {
            const { nodeIds, linkIds } = extractNodeAndLinkIds(serverRouteData);
             const renderedFeatures = renderGeoJsonRoute(
                nodeIds, 
                linkIds, 
                { 
                  fillColor: '#FF3B30',
                  strokeColor: '#FF3B30', 
                  strokeWeight: 6, 
                  strokeOpacity: 0.9, 
                  zIndex: 200 
                }
            );
            highlightedPathRef.current = renderedFeatures;
            setTimeout(() => { clearPreviousHighlightedPath(); }, 3000);
        }
    }
  }, [map, extractNodeAndLinkIds, clearPreviousHighlightedPath, renderGeoJsonRoute]);

  return {
    renderGeoJsonRoute,
    renderItineraryRoute,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    extractNodeAndLinkIds
  };
};
