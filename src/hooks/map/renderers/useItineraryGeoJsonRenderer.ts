
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
  isNaverLoadedParam: boolean; // isNaverLoadedParam 추가 (내부 유틸리티 함수에서 필요할 수 있음)
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
  isNaverLoadedParam, // 사용
  // mapPlacesWithGeoNodesFn, // 현재 renderItineraryRoute 콜백 내에서 직접 사용되지 않음
  addPolyline,
  clearAllMapPolylines,
  updateDayPolylinePaths,
}: UseItineraryGeoJsonRendererProps) => {

  const renderItineraryRoute = useCallback((
    itineraryDay: ItineraryDay | null, // 현재 선택된 일자의 데이터만 받도록 함
    allServerRoutesInput?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => {
    console.log(`${RENDERER_LOG_PREFIX} Initiating route rendering. Received ItineraryDay for day: ${itineraryDay?.day}`);
    
    // 항상 기존 폴리라인을 먼저 모두 제거
    console.log(`${RENDERER_LOG_PREFIX} Clearing all map polylines before rendering new route.`);
    clearAllMapPolylines();

    if (!map || !isNaverLoadedParam) {
      console.warn(`${RENDERER_LOG_PREFIX} Map or Naver API not ready. Route rendering aborted.`);
      if (onComplete) onComplete();
      return;
    }

    // itineraryDay가 null이거나, 유효한 장소가 없는 경우 경로를 그리지 않음
    if (!itineraryDay || !itineraryDay.places || itineraryDay.places.length === 0) {
      console.log(`${RENDERER_LOG_PREFIX} No valid ItineraryDay or no places in it. No route will be rendered. ItineraryDay:`, itineraryDay);
      if (onComplete) onComplete();
      return;
    }
    
    console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering started. Places: ${itineraryDay.places.length}`);

    let polylinePathsToCache: { lat: number; lng: number }[][] | null = null;

    const getNodeById = (nodeId: string | number): GeoJsonNodeFeature | undefined => {
      return window.geoJsonLayer?.getNodeById?.(String(nodeId));
    };
    const getLinkById = (linkId: string | number): any => {
      return window.geoJsonLayer?.getLinkById?.(String(linkId));
    };

    // 렌더링 전략 결정 (선택된 일자 데이터만 사용)
    if (itineraryDay.routeData?.linkIds && itineraryDay.routeData.linkIds.length > 0) {
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Rendering from GeoJSON links.`);
      polylinePathsToCache = renderRouteFromGeoJsonLinks(itineraryDay, addPolyline, getNodeById, getLinkById);
      if (polylinePathsToCache && polylinePathsToCache.length > 0) {
        console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Link ID based polylines generated: ${polylinePathsToCache.length}. Attempting cache update.`);
        updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);
      } else {
        console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No polylines generated from GeoJSON links.`);
      }
    } else if (allServerRoutesInput && allServerRoutesInput[itineraryDay.day]?.polylinePaths && allServerRoutesInput[itineraryDay.day]!.polylinePaths!.length > 0) {
      const serverDayData = allServerRoutesInput[itineraryDay.day];
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Rendering from server cache. Segments: ${serverDayData.polylinePaths?.length}`);
      renderRouteFromServerCache(itineraryDay, serverDayData, addPolyline);
    } else if (itineraryDay.places.length > 1) {
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No GeoJSON links or server cache. Rendering from direct place connections.`);
      polylinePathsToCache = renderRouteFromDirectConnections(itineraryDay, addPolyline);
       if (polylinePathsToCache && polylinePathsToCache.length > 0) {
        console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Direct connection polylines generated: ${polylinePathsToCache.length}. Attempting cache update.`);
        updateDayPolylinePaths(itineraryDay.day, polylinePathsToCache, itineraryDay);
      } else {
         console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: No polylines generated from direct connections.`);
      }
    } else {
      console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day}: Not enough places for direct connections (found ${itineraryDay.places.length}). No route rendered.`);
    }
    
    console.log(`${RENDERER_LOG_PREFIX} Day ${itineraryDay.day} route rendering finished.`);
    if (onComplete) onComplete();
  }, [map, isNaverLoadedParam, addPolyline, clearAllMapPolylines, updateDayPolylinePaths]);

  return {
    renderItineraryRoute,
  };
};
