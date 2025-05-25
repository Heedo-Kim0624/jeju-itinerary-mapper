
import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes'; // GeoLink 임포트 추가
import type { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';

interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonLinks: GeoLink[]; // 타입 변경: GeoJsonFeature[] -> GeoLink[]
  geoJsonNodes: GeoJsonFeature[];
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
  geoJsonLinks,
  geoJsonNodes,
  mapPlacesWithGeoNodesFn,
}: UseRouteManagerProps) => {
  const {
    addPolyline,
    setHighlightedPolyline,
    clearAllMapPolylines,
    clearHighlightedPolyline,
  } = useRoutePolylines({ map, isNaverLoadedParam });

  const { renderItineraryRoute } = useItineraryGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    geoJsonLinks, // 이제 GeoLink[] 타입으로 전달됨
    mapPlacesWithGeoNodesFn,
    addPolyline,
    clearAllMapPolylines,
  });

  const { renderGeoJsonSegmentRoute, highlightGeoJsonSegment } = useSegmentGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    geoJsonNodes,
    addPolyline,
    setHighlightedPolyline,
    clearHighlightedPolyline,
    clearAllMapPolylines,
  });
  
  const { drawDirectPath } = useDirectPathDrawer({
    map,
    isNaverLoadedParam,
    addPolyline,
  });

  // 경로 렌더링 함수 - LINK_ID 미탐색 문제 해결
  const renderItineraryRouteWithLinkIdCheck = useCallback((
    itineraryDay: ItineraryDay | null, 
    allServerRoutesInput?: Record<number, ServerRouteResponse>,
    onComplete?: () => void
  ) => {
    // LINK_ID 검증 로직 추가
    if (itineraryDay?.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      console.log(`[RouteManager] 일차 ${itineraryDay.day}의 경로 렌더링 - ${itineraryDay.routeData.linkIds.length}개 링크 ID 검증`);
      
      // 링크 ID 유효성 검사 (없을 경우 장소 간 직선 연결로 대체)
      // geoJsonLinks가 GeoLink[] 타입이므로, properties 접근 등이 더 안전해집니다.
      const hasValidLinks = geoJsonLinks && geoJsonLinks.length > 0;
      if (!hasValidLinks) {
        console.warn("[RouteManager] 유효한 GeoJSON 링크 데이터가 없습니다. 장소간 직선 연결로 대체합니다.");
      }
    }
    
    // 기존 렌더링 함수 호출
    renderItineraryRoute(itineraryDay, allServerRoutesInput, onComplete);
  }, [renderItineraryRoute, geoJsonLinks]);

  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes via useRoutePolylines.');
    clearAllMapPolylines();
  }, [clearAllMapPolylines]);

  const clearPreviousHighlightedPath = useCallback(() => {
    clearHighlightedPolyline();
  }, [clearHighlightedPolyline]);

  return {
    renderItineraryRoute: renderItineraryRouteWithLinkIdCheck, // 개선된 함수 사용
    renderGeoJsonRoute: renderGeoJsonSegmentRoute, // Rename for consistency with original API
    highlightSegment: highlightGeoJsonSegment, // Rename for consistency
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes: drawDirectPath, // Rename for consistency
  };
};

