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

  const updateDayPolylinePaths = useCallback(
    (day: number, polylinePaths: { lat: number; lng: number }[][], currentItineraryDayData: ItineraryDay) => {
    setServerRoutesDataState(prev => {
      const existingDayData = prev[day];

      if (existingDayData) {
        // console.log(`[useServerRoutes] Day ${day} polylinePaths 업데이트 시도. 기존 데이터 있음. 이전 경로 수: ${existingDayData.polylinePaths?.length || 0}, 새 경로 수: ${polylinePaths.length}`);
        return {
          ...prev,
          [day]: {
            ...existingDayData,
            polylinePaths,
          },
        };
      } else if (currentItineraryDayData && currentItineraryDayData.day === day) {
        // prev[day]가 없을 때, currentItineraryDayData를 기반으로 새 항목 생성
        console.warn(`[useServerRoutes] updateDayPolylinePaths: Day ${day} 데이터가 없어 새로 생성합니다. 제공된 itineraryDayData 사용.`);
        return {
          ...prev,
          [day]: {
            day: day,
            itineraryDayData: currentItineraryDayData,
            nodeIds: currentItineraryDayData.routeData?.nodeIds || [],
            linkIds: currentItineraryDayData.routeData?.linkIds || [],
            interleaved_route: currentItineraryDayData.interleaved_route || [],
            polylinePaths, // 새 폴리라인 경로 저장
          },
        };
      } else {
        // currentItineraryDayData가 없거나 day가 일치하지 않으면 업데이트 불가
        console.error(`[useServerRoutes] updateDayPolylinePaths: Day ${day} 데이터를 찾을 수 없고, 유효한 currentItineraryDayData가 제공되지 않았습니다. 폴리라인 경로가 캐시되지 않았습니다.`);
        return prev; // 변경 없음
      }
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
