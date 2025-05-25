
import { useCallback } from 'react';
import type { ItineraryDay, Place } from '@/types/core';
import { GeoJsonNodeFeature } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import {
  renderRouteFromGeoJsonLinks,
  renderRouteFromServerCache,
  renderRouteFromDirectConnections,
} from './utils/itineraryRouteRenderUtils';

interface UseItineraryGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[];
  addPolyline: (
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ) => any | null;
  clearAllMapPolylines: () => void; // This is crucial
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => void;
}

const RENDERER_LOG_PREFIX = '[ItineraryGeoJsonRenderer]';

export const useItineraryGeoJsonRenderer = ({
  map,
  // isNaverLoadedParam, // Not directly used in the renderItineraryRoute callback itself
  // mapPlacesWithGeoNodesFn, // Not directly used in the renderItineraryRoute callback
  addPolyline,
  clearAllMapPolylines, // Ensures all previous polylines are cleared before drawing new ones
  updateDayPolylinePaths,
}: UseItineraryGeoJsonRendererProps) => {

  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => {
    // Always clear existing polylines first
    console.log(`${RENDERER_LOG_PREFIX} Clearing all map polylines before rendering new route.`);
    clearAllMapPolylines(); // This should be effective.

    if (!map || !itineraryDay) {
      console.log(`${RENDERER_LOG_PREFIX} No map or itineraryDay provided. Route rendering aborted. ItineraryDay:`, itineraryDay);
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering started. Places: ${itineraryDay.places?.length}`);
    // clearAllMapPolylines(); // Moved to the top to ensure it's always called

    let polylinePathsToCache: { lat: number; lng: number }[][] | null = null;

    const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
      return window.geoJsonLayer?.getNodeById?.(String(nodeId));
    };
    const getLinkById = (linkId: string | number): any => {
      return window.geoJsonLayer?.getLinkById?.(String(linkId));
    };

    // Determine rendering strategy
    if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Rendering from GeoJSON links.`);
      polylinePathsToCache = renderRouteFromGeoJsonLinks(itineraryDay, addPolyline, getNodeById, getLinkById);
      if (polylinePathsToCache && polylinePathsToCache.length > 0) {
        console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Link ID based polylines generated: ${polylinePathsToCache.length}. Attempting cache update.`);
        updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);
      } else {
        console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No polylines generated from GeoJSON links. Potentially falling back to direct connections if no server cache.`);
      }
    } else if (allServerRoutesInput && allServerRoutesInput[itineraryDay.day]?.polylinePaths && allServerRoutesInput[itineraryDay.day]!.polylinePaths!.length > 0) {
      const serverDayData = allServerRoutesInput[itineraryDay.day];
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Rendering from server cache. Segments: ${serverDayData.polylinePaths?.length}`);
      renderRouteFromServerCache(itineraryDay, serverDayData, addPolyline);
    } else if (itineraryDay.places && itineraryDay.places.length > 1) { // Need at least 2 places for direct connections
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No GeoJSON links or server cache. Rendering from direct place connections.`);
      polylinePathsToCache = renderRouteFromDirectConnections(itineraryDay, addPolyline);
       if (polylinePathsToCache && polylinePathsToCache.length > 0) {
        console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Direct connection polylines generated: ${polylinePathsToCache.length}. Attempting cache update.`);
        updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);
      } else {
         console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No polylines generated from direct connections.`);
      }
    } else {
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No viable route data (Link IDs, Server Cache, or sufficient Places for direct connections). No route rendered.`);
    }
    
    console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering finished.`);
    if (onComplete) onComplete();
  }, [map, addPolyline, clearAllMapPolylines, updateDayPolylinePaths]); // Removed mapPlacesWithGeoNodesFn as it's not directly used by this callback after refactor.

  return {
    renderItineraryRoute,
  };
};
