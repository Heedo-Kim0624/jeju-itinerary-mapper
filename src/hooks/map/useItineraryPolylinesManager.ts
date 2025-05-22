// src/hooks/map/useItineraryPolylinesManager.ts
import { useRef, useCallback, useState } from 'react';
import { clearPolylines as clearPolylinesUtil } from '@/utils/map/mapCleanup';

export const useItineraryPolylinesManager = () => {
  const polylinesRef = useRef<any[]>([]); // Stores all active polylines (main + temporary)
  const mainRoutePolylinesRef = useRef<any[]>([]); // Stores only the main route polylines

  const addMainRoutePolyline = useCallback((polyline: any) => {
    if (polyline) {
      polylinesRef.current.push(polyline);
      mainRoutePolylinesRef.current.push(polyline);
    }
  }, []);
  
  const addTemporaryPolyline = useCallback((polyline: any) => {
    if (polyline) {
      polylinesRef.current.push(polyline);
    }
  }, []);

  const removeTemporaryPolyline = useCallback((polylineToRemove: any) => {
    if (polylineToRemove) {
      if (typeof polylineToRemove.setMap === 'function') {
        polylineToRemove.setMap(null);
      }
      polylinesRef.current = polylinesRef.current.filter(p => p !== polylineToRemove);
    }
  }, []);

  const clearAllPolylines = useCallback(() => {
    if (polylinesRef.current.length > 0) {
      clearPolylinesUtil(polylinesRef.current);
      polylinesRef.current = [];
      mainRoutePolylinesRef.current = [];
    }
  }, []);

  const clearTemporaryPolylines = useCallback(() => {
    const tempPolylines = polylinesRef.current.filter(p => !mainRoutePolylinesRef.current.includes(p));
    if (tempPolylines.length > 0) {
      clearPolylinesUtil(tempPolylines);
    }
    // Keep only main polylines in polylinesRef
    polylinesRef.current = [...mainRoutePolylinesRef.current];
  }, []);
  
  const getMainRoutePolylines = useCallback(() => mainRoutePolylinesRef.current, []);

  return {
    polylinesRef, // Exposed for direct read if necessary, but prefer managed functions
    mainRoutePolylinesRef, // Exposed for direct read if necessary
    addMainRoutePolyline,
    addTemporaryPolyline,
    removeTemporaryPolyline,
    clearAllPolylines,
    clearTemporaryPolylines,
    getMainRoutePolylines,
  };
};
