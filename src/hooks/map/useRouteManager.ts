
import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse, SegmentRoute } from '@/types/schedule';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';

interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonLinks: GeoJsonFeature[];
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
    geoJsonLinks,
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

  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes via useRoutePolylines.');
    clearAllMapPolylines();
  }, [clearAllMapPolylines]);

  const clearPreviousHighlightedPath = useCallback(() => {
    clearHighlightedPolyline();
  }, [clearHighlightedPolyline]);

  return {
    renderItineraryRoute,
    renderGeoJsonRoute: renderGeoJsonSegmentRoute, // Rename for consistency with original API
    highlightSegment: highlightGeoJsonSegment, // Rename for consistency
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes: drawDirectPath, // Rename for consistency
  };
};
