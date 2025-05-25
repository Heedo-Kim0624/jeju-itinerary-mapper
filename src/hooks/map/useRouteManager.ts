import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse } from '@/types/schedule';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';

interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonLinks: GeoLink[]; 
  geoJsonNodes: GeoJsonFeature[];
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
  itinerary: ItineraryDay[] | null; // Added itinerary
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
  geoJsonLinks,
  geoJsonNodes,
  mapPlacesWithGeoNodesFn,
  itinerary, // Added itinerary
}: UseRouteManagerProps) => {
  const {
    addPolyline,
    setHighlightedPolyline,
    clearAllMapPolylines,
    clearHighlightedPolyline,
  } = useRoutePolylines({ map, isNaverLoadedParam });

  // The useItineraryGeoJsonRenderer might be replaced by useDayRouteRenderer logic.
  // For now, keeping its structure but acknowledging it might be unused or need updates.
  const { renderItineraryRoute } = useItineraryGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    geoJsonLinks, 
    mapPlacesWithGeoNodesFn,
    addPolyline,
    clearAllMapPolylines,
    // This hook might need 'itinerary' and 'selectedDay' if it's to remain functional
    // alongside the new day-specific renderers.
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

  const renderItineraryRouteWithLinkIdCheck = useCallback((
    itineraryDay: ItineraryDay | null, 
    allServerRoutesInput?: Record<number, ServerRouteResponse>,
    onComplete?: () => void
  ) => {
    if (itineraryDay?.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      console.log(`[RouteManager] Rendering route for day ${itineraryDay.day} - ${itineraryDay.routeData.linkIds.length} link IDs`);
      
      const hasValidLinks = geoJsonLinks && geoJsonLinks.length > 0;
      if (!hasValidLinks) {
        console.warn("[RouteManager] No valid GeoJSON link data. Route rendering might use fallbacks.");
      }
    }
    
    // Call the original renderer. This might need to be adapted if the new
    // DayRouteRenderer is the primary way to show routes.
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
    renderItineraryRoute: renderItineraryRouteWithLinkIdCheck, 
    renderGeoJsonRoute: renderGeoJsonSegmentRoute, 
    highlightSegment: highlightGeoJsonSegment, 
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes: drawDirectPath, 
  };
};
