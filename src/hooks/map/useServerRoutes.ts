
import { useState, useCallback } from 'react';
import type { ServerRouteResponse } from '@/types/schedule'; // Ensure this type is correct
import type { GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes'; // Use correct type for GeoLink

// This interface was defined locally in the original file.
// It should align with ServerRouteResponse or be used consistently.
interface ServerRouteDataForDay {
  day: number;
  nodeIds: string[];
  linkIds: string[];
  interleaved_route?: (string | number)[]; // From ItineraryDay
  // Potentially other fields like total_distance_m
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

  // Function to set all server routes data at once
  const setAllServerRoutesData = useCallback((
    newRoutes: Record<number, ServerRouteDataForDay> | ((prevState: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => {
    setServerRoutesDataState(newRoutes);
    console.log('[useServerRoutes] 모든 서버 경로 데이터가 업데이트 되었습니다.');
  }, []);
  
  const getLinksForRoute = useCallback((
    linkIdsFromRoute: string[],
    getLinkByIdFunction: (id: string) => GeoLink | undefined, // Ensure GeoLink can be undefined
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
        // console.warn(`[useServerRoutes] getLinksForRoute: LINK_ID ${linkId}에 해당하는 GeoLink 데이터를 찾지 못했습니다.`);
      }
    });

    if (missingLinkCount > 0) {
      console.warn(`[useServerRoutes] getLinksForRoute: 총 ${missingLinkCount}개의 GeoLink를 찾지 못했습니다. 전체 링크 ID 수: ${linkIdsFromRoute.length}`);
    }
    return resolvedLinks;
  }, []);


  return {
    serverRoutesData, 
    setDayRouteData, 
    clearAllServerRoutes,
    getLinksForRoute, 
    setAllServerRoutesData, // Export the new setter
  };
};

