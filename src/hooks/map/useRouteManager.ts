import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import type { SegmentRoute } from '@/types/schedule';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';

interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonNodes: GeoJsonNodeFeature[];
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => void;
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
  geoJsonNodes,
  mapPlacesWithGeoNodesFn,
  updateDayPolylinePaths,
}: UseRouteManagerProps) => {
  const {
    addPolyline,
    setHighlightedPolyline,
    clearAllMapPolylines: clearAllPolylinesFromHook,
    clearHighlightedPolyline,
  } = useRoutePolylines({ map, isNaverLoadedParam });

  const { renderItineraryRoute: renderItineraryRouteFromRenderer } = useItineraryGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    mapPlacesWithGeoNodesFn,
    addPolyline,
    clearAllMapPolylines: clearAllPolylinesFromHook,
    updateDayPolylinePaths,
  });

  const { renderGeoJsonSegmentRoute, highlightGeoJsonSegment } = useSegmentGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    geoJsonNodes,
    addPolyline,
    setHighlightedPolyline,
    clearHighlightedPolyline,
    clearAllMapPolylines: clearAllPolylinesFromHook,
  });
  
  const { drawDirectPath } = useDirectPathDrawer({
    map,
    isNaverLoadedParam,
    addPolyline,
  });

  const renderItineraryRouteWithLinkIdCheck = useCallback((
    itineraryDay: ItineraryDay | null, 
    allServerRoutesInput?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => {
    if (itineraryDay?.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      console.log(`[RouteManager] 일차 ${itineraryDay.day}의 경로 렌더링 요청 - ${itineraryDay.routeData.linkIds.length}개 링크 ID`);
    } else if (itineraryDay) {
      console.log(`[RouteManager] 일차 ${itineraryDay.day}의 경로 렌더링 요청 - 링크 ID 정보 없음 또는 비어있음. 장소 수: ${itineraryDay.places?.length}`);
    } else {
      console.log(`[RouteManager] 지도 초기화 요청 (itineraryDay is null)`);
    }
    
    renderItineraryRouteFromRenderer(itineraryDay, allServerRoutesInput, onComplete);
  }, [renderItineraryRouteFromRenderer]);

  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes via useRoutePolylines.');
    clearAllPolylinesFromHook();
  }, [clearAllPolylinesFromHook]);

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
