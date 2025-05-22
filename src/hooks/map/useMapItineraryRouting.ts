
// src/hooks/map/useMapItineraryRouting.ts
import { useItineraryPolylinesManager } from './useItineraryPolylinesManager';
import { useDayRouteRenderer } from './useDayRouteRenderer';
import { useMultiDayRouteRenderer } from './useMultiDayRouteRenderer';
import { useItinerarySegmentHighlighter } from './useItinerarySegmentHighlighter';
import type { ItineraryDay } from '@/types/supabase';
import type { ItineraryRouteOptions } from '@/utils/map/itineraryRoutingUtils';

export const useMapItineraryRouting = (map: any) => {
  const {
    addMainRoutePolyline,
    addTemporaryPolyline,
    removeTemporaryPolyline,
    clearAllPolylines,
    clearTemporaryPolylines,
    mainRoutePolylinesRef, // Pass this to day route renderer
  } = useItineraryPolylinesManager();

  const {
    renderDayRoute,
    totalDistance,
    lastRenderedDay,
    currentDayMainPolyline, // Get this for the highlighter
  } = useDayRouteRenderer({ map, addMainRoutePolyline, clearAllPolylines, mainRoutePolylinesRef });

  const { renderMultiDayRoutes } = useMultiDayRouteRenderer({ map, addMainRoutePolyline, clearAllPolylines });
  
  const { highlightItinerarySegment } = useItinerarySegmentHighlighter({
    map,
    addTemporaryPolyline,
    removeTemporaryPolyline,
    clearTemporaryPolylines,
    currentDayMainPolyline, // Pass the current day's main polyline
  });

  // Expose public API
  const clearAllRoutes = clearAllPolylines; // Alias for clarity and consistency with old API
  
  // The main highlightSegment function to match the original API
  const highlightSegment = (fromIndex: number, toIndex: number, itineraryDay: ItineraryDay) => {
    return highlightItinerarySegment(fromIndex, toIndex, itineraryDay);
  };

  return {
    renderDayRoute: (itineraryDay: ItineraryDay | null, options?: ItineraryRouteOptions) => renderDayRoute(itineraryDay, options),
    renderMultiDayRoutes: (itinerary: ItineraryDay[] | null) => renderMultiDayRoutes(itinerary),
    clearAllRoutes,
    totalDistance,
    highlightSegment,
    lastRenderedDay,
  };
};
