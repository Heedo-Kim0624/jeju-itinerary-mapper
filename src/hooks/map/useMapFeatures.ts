import { useCallback, useRef } from 'react';
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { ServerRouteResponse, ExtractedRouteData, ServerRouteSummaryItem } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute, parseInterleavedRoute } from '@/utils/routeParser';

/**
 * 지도 특성(마커, 경로 등) 관리 훅
 */
export const useMapFeatures = (map: any) => {
  // 노드 ID로부터 링크 ID 추출 (서버 응답 형식에 따라 조정 필요)
  const extractNodeAndLinkIds = useCallback((routeItem: SimplifiedServerRouteResponse | FullServerRouteResponse): ExtractedRouteData => {
    // interleaved_route가 주 데이터 소스
    if (routeItem.interleaved_route && routeItem.interleaved_route.length > 0) {
        return {
            nodeIds: extractAllNodesFromRoute(routeItem.interleaved_route).map(String),
            linkIds: extractAllLinksFromRoute(routeItem.interleaved_route).map(String),
        };
    }
    // FullServerRouteResponse (기존 타입) 폴백
    if ('nodeIds' in routeItem && 'linkIds' in routeItem && routeItem.nodeIds && routeItem.linkIds) {
      return {
        nodeIds: routeItem.nodeIds.map(id => id.toString()),
        linkIds: routeItem.linkIds.map(id => id.toString())
      };
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
    // serverRoutesData는 이제 직접 사용되지 않고, itineraryDay에 포함된 interleaved_route 사용
    // 이 인자는 타입 일관성을 위해 유지하거나, 호출부에서 제거 가능
    serverRoutesData: Record<number, SimplifiedServerRouteResponse | FullServerRouteResponse>, 
    renderDayRouteFallback: (day: ItineraryDay) => void,
    clearAllRoutes: () => void
  ) => {
    if (!map || !itineraryDay) {
      clearAllRoutes(); // 이전 경로들 모두 제거
      return;
    }
    
    clearAllRoutes(); // 해당 일자 렌더링 전 이전 경로들 제거
    
    // interleaved_route 우선 사용
    if (window.geoJsonLayer && itineraryDay.interleaved_route && itineraryDay.interleaved_route.length > 0) {
      console.log(`[useMapFeatures] GeoJSON 경로 렌더링 (interleaved): 일자 ${itineraryDay.day}`);
      
      const nodeIds = extractAllNodesFromRoute(itineraryDay.interleaved_route).map(String);
      const linkIds = extractAllLinksFromRoute(itineraryDay.interleaved_route).map(String);
      
      console.log("🗺️ [useMapFeatures] 시각화 대상 노드/링크 ID (interleaved):", { nodeIds_count: nodeIds.length, linkIds_count: linkIds.length });

      renderGeoJsonRoute(
        nodeIds, 
        linkIds,
        {
          strokeColor: '#3366FF', 
          strokeWeight: 5,
          strokeOpacity: 0.8,
          zIndex: 150 // 마커보다 뒤, 일반 geojson보다는 위
        }
      );
      return;
    } else if (window.geoJsonLayer && itineraryDay.routeData?.nodeIds && itineraryDay.routeData?.linkIds) {
      // 기존 nodeIds, linkIds 방식 (폴백)
      console.log(`[useMapFeatures] 서버 기반 GeoJSON 경로 렌더링 시도 (nodeIds/linkIds): 일자 ${itineraryDay.day}`);
      renderGeoJsonRoute(
        itineraryDay.routeData.nodeIds,
        itineraryDay.routeData.linkIds,
        {
          strokeColor: '#FF8C00', // 주황색 경로 (폴백 표시)
          strokeWeight: 5,
          strokeOpacity: 0.7,
          zIndex: 150
        }
      );
      return;
    }
    
    console.warn(`[useMapFeatures] GeoJSON 경로 데이터 부족, Naver Polyline 폴백 경로 렌더링: 일자 ${itineraryDay.day}`);
    renderDayRouteFallback(itineraryDay);
  }, [map, renderGeoJsonRoute, /* extractNodeAndLinkIds -> 이제 직접 파싱 */]);
  
  // 특정 장소 인덱스의 경로 하이라이트
  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay, serverRoutesData: Record<number, SimplifiedServerRouteResponse | FullServerRouteResponse>) => {
    if (!map || !itineraryDay || !itineraryDay.places || !window.geoJsonLayer) return;
    
    if (placeIndex < 0 || placeIndex >= itineraryDay.places.length) {
      console.log('유효하지 않은 장소 인덱스:', placeIndex);
      return;
    }

    // 기존 하이라이트 제거
    clearPreviousHighlightedPath();

    if (itineraryDay.interleaved_route) {
        const parsedSegments = parseInterleavedRoute(itineraryDay.interleaved_route);
        if (placeIndex === 0 && itineraryDay.places.length > 0) { // 첫번째 장소는 이전경로 없음, 해당 장소로 panTo
            const firstPlace = itineraryDay.places[0];
            if (map.panTo && firstPlace.y && firstPlace.x) {
                map.panTo(new window.naver.maps.LatLng(firstPlace.y, firstPlace.x));
            }
            return;
        }
        if (placeIndex === 0) return;

        const targetSegmentIndex = placeIndex -1; // placeIndex 1은 segments[0] (0->1)
        if (targetSegmentIndex < parsedSegments.length) {
            const segment = parsedSegments[targetSegmentIndex];
            // segment.from, segment.to는 노드 ID, segment.links는 링크 ID 배열
            const segmentNodes = extractAllNodesFromRoute([segment.from, ...segment.links, segment.to].filter(Boolean)).map(String);
            const segmentLinks = segment.links.map(String);
            
            console.log(`[useMapFeatures] 경로 하이라이트: ${itineraryDay.places[placeIndex-1]?.name || '이전 장소'} -> ${itineraryDay.places[placeIndex]?.name || '현재 장소'}`);
            const renderedFeatures = renderGeoJsonRoute(
                segmentNodes,
                segmentLinks,
                { strokeColor: '#FF3B30', strokeWeight: 7, strokeOpacity: 0.9, zIndex: 250 } // 더 두껍고 진하게
            );
            highlightedPathRef.current = renderedFeatures;

            // 중심점으로 이동 (세그먼트의 중간 또는 도착지점)
            const targetPlace = itineraryDay.places[placeIndex];
            if (map.panTo && targetPlace && typeof targetPlace.y === 'number' && typeof targetPlace.x === 'number') {
                 map.panTo(new window.naver.maps.LatLng(targetPlace.y, targetPlace.x));
            }

            setTimeout(() => {
                clearPreviousHighlightedPath();
            }, 5000); // 하이라이트 시간 증가
        } else {
            console.warn(`[useMapFeatures] 세그먼트 인덱스 ${targetSegmentIndex}가 범위를 벗어났습니다. (세그먼트 수: ${parsedSegments.length})`);
        }
    } else {
        console.warn("[useMapFeatures] interleaved_route가 없어 구간 하이라이트를 할 수 없습니다.");
        // 폴백: 전체 경로 다시 그리기 (선택적)
        // const dayRouteInfo = serverRoutesData[itineraryDay.day];
        // if (dayRouteInfo) {
        //     const { nodeIds, linkIds } = extractNodeAndLinkIds(dayRouteInfo);
        //     const renderedFeatures = renderGeoJsonRoute(nodeIds, linkIds, { strokeColor: '#FF3B30', strokeWeight: 6, zIndex: 200 });
        //     highlightedPathRef.current = renderedFeatures;
        //     setTimeout(() => { clearPreviousHighlightedPath(); }, 3000);
        // }
    }
  }, [map, /* extractNodeAndLinkIds is not directly used here */, clearPreviousHighlightedPath, renderGeoJsonRoute]);

  return {
    renderGeoJsonRoute,
    renderItineraryRoute,
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    extractNodeAndLinkIds
  };
};
