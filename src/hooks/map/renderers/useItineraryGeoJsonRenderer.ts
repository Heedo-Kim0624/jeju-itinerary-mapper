
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
    clearAllMapPolylines();
    
    if (!map || !isNaverLoadedParam) {
      if (onComplete) onComplete();
      return;
    }

    if (!itineraryDay || !itineraryDay.places || itineraryDay.places.length === 0) {
      if (onComplete) onComplete();
      return;
    }
    
    const dayId = itineraryDay.day;
    let polylinePathsToCache: { lat: number; lng: number }[][] | null = null;

    const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
      return window.geoJsonLayer?.getNodeById?.(String(nodeId));
    };
    const getLinkById = (linkId: string | number): any => {
      return window.geoJsonLayer?.getLinkById?.(String(linkId));
    };

    try {
      if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
        polylinePathsToCache = renderRouteFromGeoJsonLinks(itineraryDay, addPolyline, getNodeById, getLinkById);
        
        if (polylinePathsToCache && polylinePathsToCache.length > 0) {
          updateDayPolylinePaths(dayId, polylinePathsToCache, itineraryDay);
        }
      } else if (allServerRoutesInput && allServerRoutesInput[dayId]?.polylinePaths && allServerRoutesInput[dayId]!.polylinePaths!.length > 0) {
        const serverDayData = allServerRoutesInput[dayId];
        renderRouteFromServerCache(itineraryDay, serverDayData, addPolyline);
      } else if (itineraryDay.places.length > 1) {
        polylinePathsToCache = renderRouteFromDirectConnections(itineraryDay, addPolyline);
        
        if (polylinePathsToCache && polylinePathsToCache.length > 0) {
          updateDayPolylinePaths(dayId, polylinePathsToCache, itineraryDay);
        }
      }
    } catch (error) {
      console.error(`[ItineraryGeoJsonRenderer] Error rendering route for day ${dayId}:`, error);
    } finally {
      if (onComplete) onComplete();
    }
  }, [
    map, 
    isNaverLoadedParam, 
    addPolyline, 
    clearAllMapPolylines, 
  ]);

  return {
    renderItineraryRoute,
  };
};
