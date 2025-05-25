
// src/hooks/map/useMapItineraryRouting.ts
import { useItineraryPolylinesManager } from './useItineraryPolylinesManager';
import { useDayRouteRenderer } from './useDayRouteRenderer';
import { useMultiDayRouteRenderer } from './useMultiDayRouteRenderer';
import { useItinerarySegmentHighlighter } from './useItinerarySegmentHighlighter';
import type { ItineraryDay } from '@/types/supabase';
import type { ItineraryRouteOptions } from '@/utils/map/itineraryRoutingUtils';
import { useGeoJsonData } from './useGeoJsonData'; 
import type { GeoLink } from '@/types/core/route-data';


export const useMapItineraryRouting = (map: any) => {
  const {
    addMainRoutePolyline,
    addTemporaryPolyline,
    removeTemporaryPolyline,
    clearAllPolylines,
    clearTemporaryPolylines,
  } = useItineraryPolylinesManager();

  const { geoJsonLinks } = useGeoJsonData(); 

  const dayRouteRendererInstance = useDayRouteRenderer({ 
    map, 
    isNaverLoaded: !!(map && window.naver?.maps), 
    geoJsonLinks: geoJsonLinks as GeoLink[], 
  });


  const { renderMultiDayRoutes } = useMultiDayRouteRenderer({ map, addMainRoutePolyline, clearAllPolylines });
  
  const { highlightItinerarySegment } = useItinerarySegmentHighlighter({
    map,
    addTemporaryPolyline,
    removeTemporaryPolyline,
    clearTemporaryPolylines,
    currentDayMainPolyline: null, // TODO: Determine the correct source for this or update hook
  });

  const clearAllRoutes = clearAllPolylines; 
  
  const highlightSegment = (fromIndex: number, toIndex: number, itineraryDay: ItineraryDay) => {
    return highlightItinerarySegment(fromIndex, toIndex, itineraryDay);
  };

  const renderDayRouteFromStore = () => {
    dayRouteRendererInstance.renderDayRoute();
  };

  return {
    renderDayRoute: renderDayRouteFromStore, 
    renderMultiDayRoutes: (itinerary: ItineraryDay[] | null) => renderMultiDayRoutes(itinerary),
    clearAllRoutes,
    highlightSegment,
  };
};
