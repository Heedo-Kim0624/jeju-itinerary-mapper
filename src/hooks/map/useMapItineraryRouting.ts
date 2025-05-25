
// src/hooks/map/useMapItineraryRouting.ts
import { useItineraryPolylinesManager } from './useItineraryPolylinesManager';
import { useDayRouteRenderer } from './useDayRouteRenderer';
import { useMultiDayRouteRenderer } from './useMultiDayRouteRenderer';
import { useItinerarySegmentHighlighter } from './useItinerarySegmentHighlighter';
import type { ItineraryDay } from '@/types/supabase';
import type { ItineraryRouteOptions } from '@/utils/map/itineraryRoutingUtils';
import { useGeoJsonData } from './useGeoJsonData'; // geoJsonLinks를 가져오기 위해 추가
import type { GeoLink } from '@/types/core/route-data';


export const useMapItineraryRouting = (map: any) => {
  const {
    addMainRoutePolyline,
    addTemporaryPolyline,
    removeTemporaryPolyline,
    clearAllPolylines,
    clearTemporaryPolylines,
    // mainRoutePolylinesRef, // useDayRouteRenderer에서 직접 관리하지 않음
  } = useItineraryPolylinesManager();

  const { geoJsonLinks } = useGeoJsonData(); // geoJsonLinks 가져오기

  const {
    // useDayRouteRenderer는 이제 totalDistance, lastRenderedDay, currentDayMainPolyline 등을 반환하지 않습니다.
    // renderDayRoute, // 이름 충돌을 피하기 위해 아래에서 직접 사용
    // clearAllPolylines: clearDayRoutePolylines, // 이름 충돌을 피하기 위해 변경 또는 직접 사용
  } = useDayRouteRenderer({ 
    map, 
    isNaverLoaded: !!(map && window.naver?.maps), // isNaverLoaded를 map 존재 여부로 판단
    geoJsonLinks: geoJsonLinks as GeoLink[], // 타입 단언
    // addMainRoutePolyline, // useDayRouteRenderer는 이 prop을 받지 않습니다.
    // clearAllPolylines, // useDayRouteRenderer는 이 prop을 받지 않습니다.
    // mainRoutePolylinesRef, // useDayRouteRenderer는 이 prop을 받지 않습니다.
  });
  const dayRouteRendererInstance = useDayRouteRenderer({ map, isNaverLoaded: !!(map && window.naver?.maps), geoJsonLinks: geoJsonLinks as GeoLink[] });


  const { renderMultiDayRoutes } = useMultiDayRouteRenderer({ map, addMainRoutePolyline, clearAllPolylines });
  
  const { highlightItinerarySegment } = useItinerarySegmentHighlighter({
    map,
    addTemporaryPolyline,
    removeTemporaryPolyline,
    clearTemporaryPolylines,
    // currentDayMainPolyline, // useDayRouteRenderer에서 반환하지 않으므로 제거 또는 다른 방식으로 관리
  });

  const clearAllRoutes = clearAllPolylines; 
  
  const highlightSegment = (fromIndex: number, toIndex: number, itineraryDay: ItineraryDay) => {
    return highlightItinerarySegment(fromIndex, toIndex, itineraryDay);
  };

  // useDayRouteRenderer의 renderDayRoute는 인자를 받지 않으므로,
  // 이 함수는 다른 역할을 하거나, useDayRouteRenderer의 renderDayRoute를 직접 호출해야 합니다.
  // 여기서는 DayRouteRenderer의 renderDayRoute를 사용하도록 수정합니다.
  const renderDayRouteFromStore = () => {
    dayRouteRendererInstance.renderDayRoute();
  };

  return {
    // renderDayRoute: (itineraryDay: ItineraryDay | null, options?: ItineraryRouteOptions) => renderDayRoute(itineraryDay, options), // 이전 버전의 renderDayRoute
    renderDayRoute: renderDayRouteFromStore, // Store 기반의 렌더링 함수
    renderMultiDayRoutes: (itinerary: ItineraryDay[] | null) => renderMultiDayRoutes(itinerary),
    clearAllRoutes,
    // totalDistance, // useDayRouteRenderer에서 제거됨
    highlightSegment,
    // lastRenderedDay, // useDayRouteRenderer에서 제거됨
  };
};
