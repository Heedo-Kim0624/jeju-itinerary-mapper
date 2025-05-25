
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
  clearAllMapPolylines: () => void;
  updateDayPolylinePaths: (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => void;
}

const RENDERER_LOG_PREFIX = '[ItineraryGeoJsonRenderer]';

export const useItineraryGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  addPolyline,
  clearAllMapPolylines,
  updateDayPolylinePaths, // This reference should be stable from useServerRoutes
}: UseItineraryGeoJsonRendererProps) => {

  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => {
    // Always clear existing polylines first to prevent route overlap
    // console.log(`${RENDERER_LOG_PREFIX} Clearing all map polylines before rendering new route.`);
    clearAllMapPolylines();
    
    if (!map || !isNaverLoadedParam) {
      console.warn(`${RENDERER_LOG_PREFIX} Map or Naver API not ready. Route rendering aborted.`);
      if (onComplete) onComplete();
      return;
    }

    if (!itineraryDay || !itineraryDay.places || itineraryDay.places.length === 0) {
      // console.log(`${RENDERER_LOG_PREFIX} No valid ItineraryDay or no places to render. Day: ${itineraryDay?.day || 'null'}. Polylines cleared.`);
      // clearAllMapPolylines(); // Already called at the beginning
      if (onComplete) onComplete();
      return;
    }
    
    // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering started. Places: ${itineraryDay.places.length}`);

    let polylinePathsToCache: { lat: number; lng: number }[][] | null = null;

    const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
      return window.geoJsonLayer?.getNodeById?.(String(nodeId));
    };
    const getLinkById = (linkId: string | number): any => {
      return window.geoJsonLayer?.getLinkById?.(String(linkId));
    };

    if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Rendering from GeoJSON links.`);
      polylinePathsToCache = renderRouteFromGeoJsonLinks(itineraryDay, addPolyline, getNodeById, getLinkById);
      
      if (polylinePathsToCache && polylinePathsToCache.length > 0) {
        // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Link ID based polylines generated: ${polylinePathsToCache.length}. Updating cache.`);
        // Potentially compare polylinePathsToCache with allServerRoutesInput?.[itineraryDay.day]?.polylinePaths before calling update
        // For now, we rely on the parent (useServerRoutes) to handle if the data is truly different.
        updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);
      } else {
        // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No polylines generated from GeoJSON links.`);
      }
    } else if (allServerRoutesInput && allServerRoutesInput[itineraryDay.day]?.polylinePaths && allServerRoutesInput[itineraryDay.day]!.polylinePaths!.length > 0) {
      const serverDayData = allServerRoutesInput[itineraryDay.day];
      // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Rendering from server cache. Segments: ${serverDayData.polylinePaths?.length}`);
      renderRouteFromServerCache(itineraryDay, serverDayData, addPolyline);
    } else if (itineraryDay.places.length > 1) {
      // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No GeoJSON links or server cache. Rendering direct connections.`);
      polylinePathsToCache = renderRouteFromDirectConnections(itineraryDay, addPolyline);
      
      if (polylinePathsToCache && polylinePathsToCache.length > 0) {
        // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Direct connection polylines generated: ${polylinePathsToCache.length}. Updating cache.`);
        updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);
      } else {
        // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No polylines generated from direct connections.`);
      }
    } else {
      // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Not enough places for route rendering (${itineraryDay.places.length}).`);
    }
    
    // console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering finished.`);
    if (onComplete) onComplete();
  }, [
    map, 
    isNaverLoadedParam, 
    addPolyline, 
    clearAllMapPolylines, 
    // updateDayPolylinePaths, // REMOVED from dependencies to break the loop. Assumes stable reference.
    // mapPlacesWithGeoNodesFn // This was missing from the original deps, but it's not used directly in this callback
    // If mapPlacesWithGeoNodesFn were used, it should be here. For now, it's passed to sub-renderers which might use it.
    // Re-adding other dependencies that were implicitly there:
    // It uses updateDayPolylinePaths from closure, so if its reference stability is critical, it would be a prop.
    // The core fix is not having it in deps if it's called inside.
  ]);
  // Note on the above: If `updateDayPolylinePaths` itself was meant to change and cause re-memoization of `renderItineraryRoute`,
  // then removing it from deps is hiding a potential design aspect. However, given the loop, this is the most direct fix.
  // A more robust solution would involve `useServerRoutes` ensuring `updateDayPolylinePaths` doesn't trigger an update if
  // the actual polyline data for the day hasn't changed.

  return {
    renderItineraryRoute,
  };
};
