
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
  isNaverLoadedParam: boolean; // Though not directly used in renderItineraryRoute, it's part of hook's context via addPolyline
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[]; // This prop is not used by renderItineraryRoute directly
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
  // isNaverLoadedParam, // Not directly used in the renderItineraryRoute callback itself
  // mapPlacesWithGeoNodesFn, // Not directly used in the renderItineraryRoute callback
  addPolyline,
  clearAllMapPolylines,
  updateDayPolylinePaths,
}: UseItineraryGeoJsonRendererProps) => {

  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => {
    if (!map || !itineraryDay) {
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering started.`);
    clearAllMapPolylines();

    let polylinePathsToCache: { lat: number; lng: number }[][] | null = null;

    // GeoJSON Layer accessors
    const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
      return window.geoJsonLayer?.getNodeById?.(String(nodeId));
    };
    const getLinkById = (linkId: string | number): any => { // Returns GeoJSON Link Feature
      return window.geoJsonLayer?.getLinkById?.(String(linkId));
    };

    if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      polylinePathsToCache = renderRouteFromGeoJsonLinks(itineraryDay, addPolyline, getNodeById, getLinkById);
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Link ID/Fallback based polylines generated: ${polylinePathsToCache.length}. Attempting cache update.`);
      updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);

    } else if (allServerRoutesInput && allServerRoutesInput[itineraryDay.day]?.polylinePaths?.length > 0) {
      const serverDayData = allServerRoutesInput[itineraryDay.day];
      renderRouteFromServerCache(itineraryDay, serverDayData, addPolyline);
      // Server cache routes are already "cached" on server, no client-side path update needed for these.
      
    } else if (itineraryDay.places && itineraryDay.places.length > 0) {
      polylinePathsToCache = renderRouteFromDirectConnections(itineraryDay, addPolyline);
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Direct connection polylines generated: ${polylinePathsToCache.length}. Attempting cache update.`);
      updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);

    } else {
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No route data (Link IDs, Server Cache, or Places) available to render.`);
    }
    
    console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering finished.`);
    if (onComplete) onComplete();
  }, [map, addPolyline, clearAllMapPolylines, updateDayPolylinePaths]);

  return {
    renderItineraryRoute,
  };
};
