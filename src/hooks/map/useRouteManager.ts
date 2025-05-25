
import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
// GeoJsonNodeFeature 타입을 import 합니다.
import type { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';

interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonNodes: GeoJsonNodeFeature[]; // GeoJsonNodeFeature[] 사용
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
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
    mapPlacesWithGeoNodesFn,
    addPolyline,
    clearAllMapPolylines,
  });

  const { renderGeoJsonSegmentRoute, highlightGeoJsonSegment } = useSegmentGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    geoJsonNodes, // GeoJsonNodeFeature[]를 그대로 전달
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

  const renderItineraryRouteWithLinkIdCheck = useCallback((
    itineraryDay: ItineraryDay | null, 
    allServerRoutesInput?: Record<number, ServerRouteResponse>,
    onComplete?: () => void
  ) => {
    if (itineraryDay?.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      console.log(`[RouteManager] 일차 ${itineraryDay.day}의 경로 렌더링 요청 - ${itineraryDay.routeData.linkIds.length}개 링크 ID`);
    }
    
    renderItineraryRoute(itineraryDay, allServerRoutesInput, onComplete);
  }, [renderItineraryRoute]);

  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes via useRoutePolylines.');
    clearAllMapPolylines();
  }, [clearAllMapPolylines]);

  const clearPreviousHighlightedPath = useCallback(() => {
    clearHighlightedPolyline();
  }, [clearHighlightedPolyline]);

  return {
    renderItineraryRoute: renderItineraryRouteWithLinkIdCheck,
    renderGeoJsonRoute: renderGeoJsonSegmentRoute,
    highlightSegment: highlightGeoJsonSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes: drawDirectPath,
  };
};
