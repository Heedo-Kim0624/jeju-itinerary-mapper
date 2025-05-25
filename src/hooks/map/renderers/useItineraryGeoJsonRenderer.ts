
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
  // mapPlacesWithGeoNodesFn 제거: 현재 직접 사용되지 않음. 필요시 utils로 이동 또는 여기서 직접 호출
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
  updateDayPolylinePaths,
}: UseItineraryGeoJsonRendererProps) => {

  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null,
    allServerRoutesInput?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void // 이 onComplete는 MapDataEffects 에서 handleRouteRenderingCompleteForContext를 호출하는 콜백임
  ) => {
    const dayIdForLog = itineraryDay?.day ?? 'null';
    const routeIdForLog = itineraryDay?.routeId ?? 'N/A';
    // console.log(`[ItineraryGeoJsonRenderer] renderItineraryRoute called for Day ${dayIdForLog}, RouteID: ${routeIdForLog}. Clearing polylines first.`);
    clearAllMapPolylines(); // 경로 렌더링 전 항상 클리어
    
    if (!map || !isNaverLoadedParam) {
      console.warn(`[ItineraryGeoJsonRenderer Day ${dayIdForLog}] Map not ready or Naver not loaded.`);
      if (onComplete) onComplete();
      return;
    }

    if (!itineraryDay || !itineraryDay.places || itineraryDay.places.length === 0) {
      // console.log(`[ItineraryGeoJsonRenderer Day ${dayIdForLog}] No itineraryDay or no places, skipping route rendering.`);
      if (onComplete) onComplete();
      return;
    }
    
    const dayId = itineraryDay.day;
    let polylinePathsToCache: { lat: number; lng: number }[][] | null = null;

    const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
      return window.geoJsonLayer?.getNodeById?.(String(nodeId));
    };
    const getLinkById = (linkId: string | number): any => { // GeoLink 타입이 더 정확할 수 있음
      return window.geoJsonLayer?.getLinkById?.(String(linkId));
    };

    try {
      // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Attempting to render route. RouteData LinkIDs: ${itineraryDay.routeData?.linkIds?.length ?? 0}`);
      if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
        // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Rendering from GeoJSON links.`);
        polylinePathsToCache = renderRouteFromGeoJsonLinks(itineraryDay, addPolyline, getNodeById, getLinkById);
        
        if (polylinePathsToCache && polylinePathsToCache.length > 0) {
          // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Caching ${polylinePathsToCache.length} polyline paths from GeoJSON links.`);
          updateDayPolylinePaths(dayId, polylinePathsToCache, itineraryDay);
        } else {
          // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] No polyline paths generated from GeoJSON links.`);
        }
      } else if (allServerRoutesInput && allServerRoutesInput[dayId]?.polylinePaths && allServerRoutesInput[dayId]!.polylinePaths!.length > 0) {
        // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Rendering from server cache. Cached paths: ${allServerRoutesInput[dayId]!.polylinePaths!.length}`);
        const serverDayData = allServerRoutesInput[dayId]!; // Not null assertion
        renderRouteFromServerCache(itineraryDay, serverDayData, addPolyline);
      } else if (itineraryDay.places.length > 1) {
        // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Rendering from direct connections (${itineraryDay.places.length} places).`);
        polylinePathsToCache = renderRouteFromDirectConnections(itineraryDay, addPolyline);
        
        if (polylinePathsToCache && polylinePathsToCache.length > 0) {
          // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Caching ${polylinePathsToCache.length} polyline paths from direct connections.`);
          updateDayPolylinePaths(dayId, polylinePathsToCache, itineraryDay);
        } else {
          // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] No polyline paths generated from direct connections.`);
        }
      } else {
        // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Not enough places to draw a route, or no linkIds/cache.`);
      }
    } catch (error) {
      console.error(`[ItineraryGeoJsonRenderer Day ${dayId}] Error rendering route:`, error);
    } finally {
      // console.log(`[ItineraryGeoJsonRenderer Day ${dayId}] Route rendering attempt finished. Calling onComplete.`);
      if (onComplete) onComplete(); // 여기가 MapDataEffects의 onComplete -> handleRouteRenderingCompleteForContext 호출
    }
  }, [
    map, 
    isNaverLoadedParam, 
    addPolyline, 
    clearAllMapPolylines,
    updateDayPolylinePaths, // 의존성 추가
  ]);

  return {
    renderItineraryRoute,
  };
};
