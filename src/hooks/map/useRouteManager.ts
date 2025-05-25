
import { useCallback } from 'react';
import type { Place, ItineraryDay as SupabaseItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse } from '@/types/schedule';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import type { ItineraryDay as CoreItineraryDay } from '@/types/core';


interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonLinks: GeoLink[]; 
  geoJsonNodes: GeoJsonFeature[];
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
  itinerary: CoreItineraryDay[] | null; 
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
  geoJsonLinks,
  geoJsonNodes,
  mapPlacesWithGeoNodesFn,
  itinerary, 
}: UseRouteManagerProps) => { 
  const {
    addPolyline,
    setHighlightedPolyline,
    clearAllMapPolylines,
    clearHighlightedPolyline,
  } = useRoutePolylines({ map, isNaverLoadedParam });

  const { renderExternalTriggeredRoute, isRendering: isItineraryRendering } = useItineraryGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    geoJsonLinksInput: geoJsonLinks, // Pass prop with distinct name
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodesFn as any, // Cast if Place type mismatch
    addPolyline,
    clearAllMapPolylines,
    itinerary, 
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
  
  const { selectedMapDay } = useRouteMemoryStore(); 

  const renderItineraryRouteWithStore = useCallback((
    itineraryDayData: CoreItineraryDay | null, 
    _allServerRoutesInput?: Record<number, ServerRouteResponse>, 
    onComplete?: () => void
  ) => {
    if (!itineraryDayData || typeof itineraryDayData.day !== 'number') {
      console.warn('[RouteManager] Invalid itineraryDayData or day number for rendering.');
      if(renderExternalTriggeredRoute && selectedMapDay){ // Fallback to current store day
        renderExternalTriggeredRoute(selectedMapDay, onComplete);
      } else if (onComplete) {
        onComplete();
      }
      return;
    }
    
    console.log(`[RouteManager] Request to render route for specific day data: ${itineraryDayData.day}. Store selected day: ${selectedMapDay}`);
    // The renderer listens to selectedMapDay. This call can be for a specific day if needed.
    renderExternalTriggeredRoute(itineraryDayData.day, onComplete);

  }, [renderExternalTriggeredRoute, selectedMapDay]);

  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes via useRoutePolylines.');
    clearAllMapPolylines();
  }, [clearAllMapPolylines]);

  const clearPreviousHighlightedPath = useCallback(() => {
    clearHighlightedPolyline();
  }, [clearHighlightedPolyline]);

  return {
    renderItineraryRoute: renderItineraryRouteWithStore, 
    renderGeoJsonRoute: renderGeoJsonSegmentRoute,
    highlightSegment: highlightGeoJsonSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes: drawDirectPath,
    isItineraryRendering, 
  };
};
