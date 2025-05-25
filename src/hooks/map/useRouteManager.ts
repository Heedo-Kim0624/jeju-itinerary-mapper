
import { useCallback, useEffect } from 'react'; // Added useEffect
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoJsonFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse } from '@/types/schedule';
import { useRoutePolylines } from './useRoutePolylines';
import { useItineraryGeoJsonRenderer } from './renderers/useItineraryGeoJsonRenderer';
import { useSegmentGeoJsonRenderer } from './renderers/useSegmentGeoJsonRenderer';
import { useDirectPathDrawer } from './renderers/useDirectPathDrawer';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; // Added
import { EventEmitter } from '@/hooks/events/useEventEmitter'; // Added
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects'; // To get itinerary for current day


interface UseRouteManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonNodes: GeoJsonFeature[]; // Still needed for segment renderer
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
}

export const useRouteManager = ({
  map,
  isNaverLoadedParam,
  geoJsonNodes, // Keep for useSegmentGeoJsonRenderer
  mapPlacesWithGeoNodesFn,
}: UseRouteManagerProps) => {
  const {
    addPolyline, // This is the function that creates Naver Polyline instances
    setHighlightedPolyline,
    clearAllMapPolylines: baseClearAllPolylines, // Base function to clear all polylines from its own list
    clearHighlightedPolyline,
  } = useRoutePolylines({ map, isNaverLoadedParam });

  const { itinerary } = useScheduleStateAndEffects(); // Get full itinerary to find current day's data
  const { selectedDay, clearAllRouteData: clearAllRouteDataFromStore, getDayRouteData, clearDayPolylines } = useRouteMemoryStore();

  const { renderItineraryRouteForDay } = useItineraryGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    mapPlacesWithGeoNodesFn,
    addPolyline, // Pass the polyline creation util
    clearAllMapPolylines: () => clearDayPolylines(selectedDay), // Pass day-specific clear
  });

  const { renderGeoJsonSegmentRoute, highlightGeoJsonSegment } = useSegmentGeoJsonRenderer({
    map,
    isNaverLoadedParam,
    geoJsonNodes,
    addPolyline,
    setHighlightedPolyline,
    clearHighlightedPolyline,
    clearAllMapPolylines: baseClearAllPolylines, // Segment renderer might manage its own set of polylines
  });
  
  const { drawDirectPath } = useDirectPathDrawer({
    map,
    isNaverLoadedParam,
    addPolyline,
  });

  // This function is called when the selected day's itinerary MIGHT need its route rendered or re-rendered.
  const renderRouteForSelectedDay = useCallback(() => {
    if (selectedDay === null) {
      console.log('[RouteManager] No day selected, cannot render route.');
      return;
    }
    const currentItineraryForDay = itinerary?.find(d => d.day === selectedDay) || null;
    console.log(`[RouteManager] Requesting to render route for selected day: ${selectedDay}`);
    renderItineraryRouteForDay(selectedDay, currentItineraryForDay);
  }, [selectedDay, itinerary, renderItineraryRouteForDay]);
  

  // Listen to mapDayChanged event to re-render routes
  useEffect(() => {
    const handleMapDayChanged = (data: { day: number }) => {
      console.log(`[RouteManager] mapDayChanged event for day ${data.day}. Rendering route.`);
      // selectedDay from store is already updated by useMapDaySelector
      renderRouteForSelectedDay(); 
    };
    const unsubscribe = EventEmitter.subscribe('mapDayChanged', handleMapDayChanged);
    
    // Initial render for the default selected day if map is ready
    if (map && isNaverLoadedParam && selectedDay !== null) {
        renderRouteForSelectedDay();
    }

    return () => unsubscribe();
  }, [map, isNaverLoadedParam, selectedDay, renderRouteForSelectedDay]);


  // This is the function that LeftPanel might call when a new itinerary is generated.
  // It now doesn't need to directly handle linkIds, as the store is initialized by useServerResponseHandler
  const triggerItineraryRouteRender = useCallback((
    _itineraryDay: ItineraryDay | null, // This specific day data is less critical now for direct rendering
    _allServerRoutesInput?: Record<number, ServerRouteResponse>, // Less relevant
    onComplete?: () => void
  ) => {
    console.log(`[RouteManager] Triggering itinerary route render, will use selectedDay from store: ${selectedDay}`);
    // The actual rendering logic is now tied to the selectedDay in the store and mapDayChanged event
    // For a *new* itinerary, ensure the store has been initialized first.
    // Then, if a day is selected, its route will be rendered via the event listener or initial effect.
    renderRouteForSelectedDay(); // Explicitly trigger for current selected day
    if (onComplete) onComplete();
  }, [selectedDay, renderRouteForSelectedDay]);


  const clearAllDrawnRoutes = useCallback(() => {
    console.log('[RouteManager] Clearing all routes from store and map.');
    clearAllRouteDataFromStore(); // This clears polylines from map via store's internal logic
    // Base clear might still be needed if useRoutePolylines tracks other polylines
    baseClearAllPolylines(); 
  }, [clearAllRouteDataFromStore, baseClearAllPolylines]);

  const clearPreviousHighlightedPath = useCallback(() => {
    clearHighlightedPolyline();
  }, [clearHighlightedPolyline]);

  return {
    renderItineraryRoute: triggerItineraryRouteRender, // Keep API for now, behavior changed
    renderGeoJsonRoute: renderGeoJsonSegmentRoute,
    highlightSegment: highlightGeoJsonSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes: drawDirectPath,
  };
};
