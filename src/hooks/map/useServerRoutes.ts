
import { useState, useCallback } from 'react';
import type { ServerRouteResponse } from '@/types/schedule'; // Ensure this type is correct
import type { GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes'; // Use correct type for GeoLink


/**
 * 서버 경로 데이터 관리 훅
 * This hook seems to primarily store raw server route responses.
 * The conversion to GeoJSON features is a utility function that could be part of this hook
 * or a separate utility if it needs access to GeoJSON data context.
 * The user's prompt suggests this hook provides `convertServerRoutesToFeatures`.
 * This function will now depend on `getLinkById` and `isGeoJsonLoaded` from `useGeoJsonState`.
 * However, hooks cannot be called conditionally or inside regular functions.
 * So, `convertServerRoutesToFeatures` needs to be refactored or the `useGeoJsonState`
 * needs to be instantiated at the top level of a component/hook that uses this.
 *
 * For now, I will make `convertServerRoutesToFeatures` accept `getLinkFeatureById` and `isGeoJsonLoaded`
 * as parameters, assuming the calling context (e.g., MapContext or another orchestrator hook)
 * will provide these.
 */

interface ServerRouteDataForDay {
  day: number;
  nodeIds: string[];
  linkIds: string[];
  interleaved_route?: (string | number)[]; // From ItineraryDay
  // Potentially other fields like total_distance_m
}

export const useServerRoutes = () => {
  const [serverRoutesData, setServerRoutesData] = useState<Record<number, ServerRouteDataForDay>>({});

  const setDayRouteData = useCallback((day: number, routeData: ServerRouteDataForDay) => {
    setServerRoutesData(prev => ({
      ...prev,
      [day]: routeData,
    }));
    console.log(`[useServerRoutes] Day ${day} 경로 데이터 설정됨:`, routeData);
  }, []);

  const clearAllServerRoutes = useCallback(() => {
    setServerRoutesData({});
    console.log('[useServerRoutes] 모든 서버 경로 데이터가 지워졌습니다.');
  }, []);
  
  // This function converts raw link IDs from server data to full GeoLink objects
  // It needs access to the GeoJSON data (specifically getLinkById).
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
        // console.warn(`[useServerRoutes] getLinksForRoute: LINK_ID ${linkId}에 해당하는 GeoLink 데이터를 찾지 못했습니다.`);
      }
    });

    if (missingLinkCount > 0) {
      console.warn(`[useServerRoutes] getLinksForRoute: 총 ${missingLinkCount}개의 GeoLink를 찾지 못했습니다. 전체 링크 ID 수: ${linkIdsFromRoute.length}`);
    }
    return resolvedLinks;
  }, []);


  return {
    serverRoutesData, // Stores Record<dayNumber, ServerRouteDataForDay>
    setDayRouteData,  // Function to set route data for a specific day
    clearAllServerRoutes,
    getLinksForRoute, // Utility to get full GeoLink objects for a list of link IDs
  };
};
