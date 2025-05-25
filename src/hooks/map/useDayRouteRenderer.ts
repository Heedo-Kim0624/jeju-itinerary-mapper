
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouteMemoryStore } from './useRouteMemoryStore';
import type { GeoLink } from '@/types/core/route-data'; // Ensure GeoLink is imported correctly

interface UseDayRouteRendererProps {
  map: any; 
  isNaverLoaded: boolean;
  geoJsonLinks: GeoLink[]; 
}

export const useDayRouteRenderer = ({ map, isNaverLoaded, geoJsonLinks }: UseDayRouteRendererProps) => {
  const selectedDay = useRouteMemoryStore(state => state.selectedDay);
  const getDayRouteData = useRouteMemoryStore(state => state.getDayRouteData);
  
  const [_renderedPolylines, setRenderedPolylines] = useState<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  
  const getLinkDataById = useCallback((linkId: string): GeoLink | undefined => {
    if (!geoJsonLinks || geoJsonLinks.length === 0) return undefined;
    return geoJsonLinks.find(link => link.properties.LINK_ID === linkId);
  }, [geoJsonLinks]);
  
  const convertCoordsToLatLngArray = useCallback((coordinates: number[][]): any[] => {
    if (!window.naver || !isNaverLoaded) return [];
    return coordinates.map(coord => new window.naver.maps.LatLng(coord[1], coord[0])); // GeoJSON: [lng, lat]
  }, [isNaverLoaded]);

  const createPolyline = useCallback((path: any[], options: any = {}) => {
    if (!map || !window.naver || !isNaverLoaded || path.length < 2) return null;
    
    const defaultOptions = {
      strokeColor: '#007AFF',
      strokeWeight: 4, // Slightly thinner than markers
      strokeOpacity: 0.75,
      strokeStyle: 'solid',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      zIndex: 50 // Below markers
    };
    
    return new window.naver.maps.Polyline({
      map,
      path,
      ...defaultOptions,
      ...options
    });
  }, [map, isNaverLoaded]);

  const clearPolylines = useCallback(() => {
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') polyline.setMap(null);
    });
    polylinesRef.current = [];
    setRenderedPolylines([]);
    // console.log('[useDayRouteRenderer] All polylines cleared.');
  }, []);
  
  const renderDayRoute = useCallback(() => {
    if (!map || !isNaverLoaded || geoJsonLinks.length === 0) {
        // console.log('[useDayRouteRenderer] Prerequsites not met for rendering route.');
        return;
    }

    clearPolylines();
    
    const dayData = getDayRouteData(selectedDay);
    if (!dayData || !dayData.linkIds || dayData.linkIds.length === 0) {
      // console.log(`[useDayRouteRenderer] No route data for day ${selectedDay}.`);
      return;
    }
    
    // console.log(`[useDayRouteRenderer] Rendering route for day ${selectedDay} with ${dayData.linkIds.length} links.`);
    
    const newPolylines: any[] = [];
    let missingLinksCount = 0;
    
    dayData.linkIds.forEach(linkId => {
      const linkGeoJson = getLinkDataById(String(linkId));
      if (!linkGeoJson) {
        missingLinksCount++;
        return;
      }
      
      const { coordinates } = linkGeoJson.geometry;
      if (!coordinates || coordinates.length < 2) {
        // console.warn(`[useDayRouteRenderer] Invalid coordinates for LINK_ID ${linkId}`);
        return;
      }
      
      const path = convertCoordsToLatLngArray(coordinates);
      if (path.length < 2) {
        // console.warn(`[useDayRouteRenderer] Path conversion failed for LINK_ID ${linkId}`);
        return;
      }
      
      const polyline = createPolyline(path);
      if (polyline) {
        newPolylines.push(polyline);
      }
    });
    
    if (missingLinksCount > 0) {
      console.warn(`[useDayRouteRenderer] Could not find GeoJSON data for ${missingLinksCount} link IDs out of ${dayData.linkIds.length}.`);
    }
    
    polylinesRef.current = newPolylines;
    setRenderedPolylines(newPolylines);
    // console.log(`[useDayRouteRenderer] Route rendering complete for day ${selectedDay}: ${newPolylines.length} polylines drawn.`);

  }, [map, isNaverLoaded, selectedDay, geoJsonLinks, getDayRouteData, getLinkDataById, convertCoordsToLatLngArray, createPolyline, clearPolylines]);
  
  useEffect(() => {
    if (map && isNaverLoaded && geoJsonLinks && geoJsonLinks.length > 0) {
      // console.log(`[useDayRouteRenderer] Effect triggered for day ${selectedDay}. Rendering route.`);
      renderDayRoute();
    }
     return () => {
        // clearPolylines(); // Similar to marker hook, clearing here might be problematic.
    };
  }, [map, isNaverLoaded, geoJsonLinks, selectedDay, renderDayRoute]);
  
  return {
    renderedPolylines: polylinesRef.current,
    renderDayRoute,
    clearAllPolylines: clearPolylines
  };
};
