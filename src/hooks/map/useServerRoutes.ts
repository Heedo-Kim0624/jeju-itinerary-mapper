
import { useState, useCallback } from 'react';
import type { GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ItineraryDay } from '@/types/supabase';

export interface ServerRouteDataForDay {
  day: number; 
  nodeIds?: string[]; 
  linkIds?: string[];
  interleaved_route?: (string | number)[];
  itineraryDayData: ItineraryDay; 
  polylinePaths?: { lat: number; lng: number }[][]; 
}

export const useServerRoutes = () => {
  const [serverRoutesData, setServerRoutesDataState] = useState<Record<number, ServerRouteDataForDay>>({});

  const setDayRouteData = useCallback((day: number, routeData: ServerRouteDataForDay) => {
    setServerRoutesDataState(prev => ({
      ...prev,
      [day]: routeData,
    }));
    console.log(`[useServerRoutes] Day ${day} 경로 데이터 설정됨:`, routeData);
  }, []);

  const clearAllServerRoutes = useCallback(() => {
    setServerRoutesDataState({});
    console.log('[useServerRoutes] 모든 서버 경로 데이터가 지워졌습니다.');
  }, []);

  const setAllServerRoutesData = useCallback((
    newRoutes: Record<number, ServerRouteDataForDay> | ((prevState: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => {
    setServerRoutesDataState(newRoutes);
    console.log('[useServerRoutes] 모든 서버 경로 데이터가 업데이트 되었습니다. 키:', newRoutes ? (typeof newRoutes === 'function' ? 'function' : Object.keys(newRoutes)) : 'null');
  }, []);
  
  const getLinksForRoute = useCallback((
    linkIdsFromRoute: string[],
    getLinkByIdFunction: (id: string) => GeoLink | undefined,
    geoJsonIsLoaded: boolean
  ): GeoLink[] => {
    if (!geoJsonIsLoaded) {
      console.warn('[useServerRoutes] getLinksForRoute: GeoJSON 데이터가 아직 로드되지 않았습니다.');
      return [];
    }
    if (!linkIdsFromRoute || linkIdsFromRoute.length === 0) {
      return [];
    }

    const resolvedLinks: GeoLink[] = [];
    let missingLinkCount = 0;

    linkIdsFromRoute.forEach(linkId => {
      const linkData = getLinkByIdFunction(String(linkId)); // Ensure string ID
      if (linkData) {
        resolvedLinks.push(linkData);
      } else {
        missingLinkCount++;
      }
    });

    if (missingLinkCount > 0) {
      console.warn(`[useServerRoutes] getLinksForRoute: 총 ${missingLinkCount}개의 GeoLink를 찾지 못했습니다. 전체 링크 ID 수: ${linkIdsFromRoute.length}`);
    }
    return resolvedLinks;
  }, []);

  const updateDayPolylinePaths = useCallback((day: number, polylinePaths: { lat: number; lng: number }[][]) => {
    setServerRoutesDataState(prev => {
      const dayData = prev[day];
      if (dayData) {
        console.log(`[useServerRoutes] Day ${day} polylinePaths 업데이트 시도. 이전 경로 수: ${dayData.polylinePaths?.length || 0}, 새 경로 수: ${polylinePaths.length}`);
        return {
          ...prev,
          [day]: {
            ...dayData,
            polylinePaths,
          },
        };
      }
      // This case should be rare if useScheduleGenerationCore initializes entries properly.
      console.warn(`[useServerRoutes] updateDayPolylinePaths: Day ${day} data not found in serverRoutesData. Polyline update failed. This might indicate an issue with initial data population for this day.`);
      return prev;
    });
  }, []);

  return {
    serverRoutesData, 
    setDayRouteData, 
    clearAllServerRoutes,
    getLinksForRoute, 
    setAllServerRoutesData,
    updateDayPolylinePaths,
  };
};
