import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/core';
import type { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import type { SegmentRoute } from '@/types/core/route-data';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';

interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonNodes: GeoJsonNodeFeature[];
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => void;
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
  geoJsonNodes,
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
    const dayForLog = itineraryDay?.day ?? 'N/A';
    const routeIdForLog = itineraryDay?.routeId ?? 'N/A';
    const linkCountForLog = itineraryDay?.routeData?.linkIds?.length ?? 0;
    const placeCountForLog = itineraryDay?.places?.length ?? 0;

    if (itineraryDay) {
      console.log(`[RouteManager] 일차 ${dayForLog} (ID: ${routeIdForLog}) 경로 렌더링 요청. 링크: ${linkCountForLog}, 장소: ${placeCountForLog}`);
    } else {
      console.log(`[RouteManager] 지도 초기화 또는 전체 경로 클리어 요청 (itineraryDay is null)`);
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
