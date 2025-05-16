import { useCallback, useRef } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import { ServerRouteResponse, ExtractedRouteData } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser'; // Ensure this import

/**
 * 지도 특성(마커, 경로 등) 관리 훅
 */
export const useMapFeatures = (map: any) => {
  // 노드 ID로부터 링크 ID 추출 (서버 응답 형식에 따라 조정 필요)
  const extractNodeAndLinkIds = useCallback((response: ServerRouteResponse): ExtractedRouteData => {
    // Prioritize interleaved_route for detailed path
    if (response.interleaved_route && response.interleaved_route.length > 0) {
      const nodes = extractAllNodesFromRoute(response.interleaved_route);
      const links = extractAllLinksFromRoute(response.interleaved_route);
      return {
        nodeIds: nodes.map(id => id.toString()),
        linkIds: links.map(id => id.toString())
      };
    }
    
    // Fallback if interleaved_route is not available
    if (response.nodeIds && response.linkIds && response.linkIds.length > 0) {
      console.warn('[MapFeatures] Falling back to nodeIds/linkIds from server response as interleaved_route is missing.');
      return {
        nodeIds: response.nodeIds.map(id => id.toString()),
        linkIds: response.linkIds.map(id => id.toString())
      };
    }
    
    if (response.nodeIds) {
      console.warn('[MapFeatures] Only nodeIds available from server response, links cannot be determined for detailed path.');
      return {
        nodeIds: response.nodeIds.map(id => id.toString()),
        linkIds: [] 
      };
    }
    
    console.warn('[MapFeatures] No valid route data found in server response.');
    return { nodeIds: [], linkIds: [] }; // Default empty
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
  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay, serverRoutesData: Record<number, ServerRouteResponse>) => {
    if (!map || !itineraryDay || !itineraryDay.places) return;
    
    if (placeIndex <= 0 || placeIndex >= itineraryDay.places.length) {
      console.log('유효하지 않은 장소 인덱스:', placeIndex);
      return;
    }
    
    const serverRouteData = serverRoutesData[itineraryDay.day];
    
    if (window.geoJsonLayer && serverRouteData && serverRouteData.interleaved_route) {
      // This function is about highlighting a segment between two PLACES.
      // The full interleaved_route is for the whole day.
      // To highlight a segment, we'd need to identify which part of interleaved_route
      // corresponds to the travel between place at (placeIndex-1) and place at placeIndex.
      // This is complex and requires mapping place IDs to node IDs within the interleaved_route.
      // For now, as a simplification, it re-highlights the whole day's route or a portion.
      // The original logic for highlighting also seemed to re-render the whole route with a different color.
      
      const { nodeIds, linkIds } = extractNodeAndLinkIds(serverRouteData); // Gets full day's path
      
      clearPreviousHighlightedPath();
      
      console.log(`장소 ${itineraryDay.places[placeIndex-1]?.name}에서 ${itineraryDay.places[placeIndex]?.name}까지의 경로 하이라이트 (전체 일일 경로 표시)`);
      
      const renderedFeatures = renderGeoJsonRoute(
        nodeIds,
        linkIds,
        {
          strokeColor: '#FF3B30', // Highlight color
          strokeWeight: 6,
          strokeOpacity: 0.9,
          zIndex: 200
        }
      );
      
      highlightedPathRef.current = renderedFeatures;
      
      setTimeout(() => {
        clearPreviousHighlightedPath();
      }, 3000);

    } else {
        console.log("GeoJSON 레이어 또는 서버 경로 데이터(interleaved_route)를 사용할 수 없어 경로 하이라이트를 건너<0xEB><0>니다.");
    }
  }, [map, extractNodeAndLinkIds, clearPreviousHighlightedPath, renderGeoJsonRoute]);

  // 일정 경로 렌더링 함수 - 서버 데이터 활용
  const renderItineraryRoute = useCallback((itineraryDay: ItineraryDay | null, serverRoutesData: Record<number, ServerRouteResponse>, renderDayRouteFallback: (day: ItineraryDay) => void, clearAllRoutes: () => void) => {
    if (!map || !itineraryDay) {
      clearAllRoutes(); // Clear routes if no itineraryDay
      return;
    }
    
    clearAllRoutes();
    
    const serverRouteData = serverRoutesData[itineraryDay.day];
    
    if (window.geoJsonLayer && serverRouteData && (serverRouteData.interleaved_route || (serverRouteData.nodeIds && serverRouteData.linkIds))) {
      console.log('서버 기반 GeoJSON 경로 렌더링 시도:', {
        일자: itineraryDay.day,
        데이터유형: serverRouteData.interleaved_route ? 'interleaved' : 'node/link arrays',
        데이터: serverRouteData
      });
      
      const { nodeIds, linkIds } = extractNodeAndLinkIds(serverRouteData);
      
      if (nodeIds.length > 0 || linkIds.length > 0) {
        console.log("🗺️ 시각화 대상 노드/링크 ID:", { nodeIds, linkIds });
        renderGeoJsonRoute(
          nodeIds, 
          linkIds,
          {
            strokeColor: '#3366FF', // Default route color
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        );
      } else {
        console.warn(`[MapFeatures] ${itineraryDay.day}일차 경로 데이터에서 노드/링크를 추출할 수 없습니다. 폴백 경로 렌더링 시도.`);
        renderDayRouteFallback(itineraryDay);
      }
      return;
    }
    
    console.warn(`[MapFeatures] ${itineraryDay.day}일차에 대한 서버 경로 데이터가 없거나 GeoJSON 레이어가 준비되지 않았습니다. 폴백 경로 렌더링.`);
    renderDayRouteFallback(itineraryDay);
  }, [map, extractNodeAndLinkIds, renderGeoJsonRoute]);

  return {
    renderGeoJsonRoute,
    renderItineraryRoute,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    extractNodeAndLinkIds
  };
};
