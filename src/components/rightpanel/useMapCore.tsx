import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadNaverMaps } from '@/utils/loadNaverMaps';
import { initializeNaverMap, createNaverLatLng } from '@/utils/map/mapInitializer';
import { panToPosition, fitBoundsToPlaces } from '@/utils/map/mapViewControls';
import { useMapResize } from '@/hooks/useMapResize';
import { useGeoJsonLayer } from '@/components/rightpanel/geojson/useGeoJsonData';
import { useMapMarkers as useMapMarkersLegacyHook } from '@/hooks/map/useMapMarkersLegacy';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { SegmentRoute } from '@/types/schedule';
import { useServerRoutes, ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import { usePlaceGeoJsonMapper } from '@/hooks/map/usePlaceGeoJsonMapper';

const MAP_ID = 'map';

const useMapCore = () => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isNaverLoaded, setIsNaverLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isMapError, setIsMapError] = useState(false);

  const {
    geoJsonData,
    showGeoJson,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
  } = useGeoJsonLayer(mapRef);

  const {
    mapPlacesWithGeoNodes,
    checkGeoJsonMapping,
  } = usePlaceGeoJsonMapper(geoJsonNodes || []);

  const {
    addMarkers: addMarkersFromHook,
    clearMarkersAndUiElements: clearMarkersAndUiElementsFromHook,
    calculateRoutes: calculateRoutesFromHook,
  } = useMapMarkersLegacyHook(mapRef.current);

  const { 
    serverRoutesData, 
    setAllServerRoutesData,
    updateDayPolylinePaths,
  } = useServerRoutes();

  const {
    renderItineraryRoute,
    renderGeoJsonRoute,
    highlightSegment,
    clearPreviousHighlightedPath,
    clearAllDrawnRoutes,
    calculateAndDrawDirectRoutes,
  } = useRouteManager({
    map: mapRef.current,
    isNaverLoadedParam: isNaverLoaded,
    geoJsonNodes: geoJsonNodes || [],
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
    updateDayPolylinePaths: updateDayPolylinePaths,
  });
  
  useEffect(() => {
    const init = async () => {
      try {
        await loadNaverMaps();
        setIsNaverLoaded(true);
        if (mapContainerRef.current && !mapRef.current) {
          const naver = window.naver;
          if (naver && naver.maps) {
            const mapInstance = initializeNaverMap(mapContainerRef.current);
            mapRef.current = mapInstance;
            setIsMapInitialized(true);
            console.log('[useMapCore] Naver Map initialized and configured.');
          } else {
            throw new Error("Naver Maps API not fully loaded.");
          }
        }
      } catch (error) {
        console.error('Failed to load Naver Maps:', error);
        setIsMapError(true);
      }
    };
    init();

    return () => {
      // Cleanup if necessary, though map instance might be managed elsewhere or not need explicit destroy
    };
  }, []);

  useMapResize(mapRef.current, mapContainerRef.current, [isMapInitialized]);

  const panTo = useCallback((locationOrCoords: string | {lat: number, lng: number}) => {
    if (mapRef.current && isMapInitialized && isNaverLoaded) {
      if (typeof locationOrCoords === 'string') {
        console.warn("panTo with string address not implemented, requires geocoding.");
      } else {
        panToPosition(mapRef.current, locationOrCoords.lat, locationOrCoords.lng);
      }
    }
  }, [isMapInitialized, isNaverLoaded]);

  const showRouteForPlaceIndex = useCallback((placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => {
    if (!mapRef.current || !itineraryDay || !itineraryDay.routeData || !itineraryDay.routeData.segmentRoutes) {
      console.warn("[useMapCore] Map not ready or missing route data for showRouteForPlaceIndex.");
      if (onComplete) onComplete();
      return;
    }
    
    const segment = itineraryDay.routeData.segmentRoutes.find(
      seg => seg.fromIndex === placeIndex || seg.toIndex === placeIndex + 1 
    );

    if (segment) {
      console.log(`[useMapCore] Highlighting segment for place index ${placeIndex}:`, segment);
      highlightSegment(segment); 
    } else {
      console.log(`[useMapCore] No specific segment found for place index ${placeIndex}, clearing previous highlight.`);
      clearPreviousHighlightedPath(); 
    }
    if (onComplete) onComplete();
  }, [highlightSegment, clearPreviousHighlightedPath, isMapInitialized]);

  if (process.env.NODE_ENV === 'development' && mapRef.current) {
    // console.log("[useMapCore] Hook Values:", {
    //   isMapInitialized, isNaverLoaded, isGeoJsonLoaded,
    //   geoJsonNodesCount: geoJsonNodes?.length,
    //   geoJsonLinksCount: geoJsonLinks?.length,
    //   hasRenderItineraryRoute: typeof renderItineraryRoute === 'function',
    //   hasHighlightSegment: typeof highlightSegment === 'function',
    //   serverRoutesDataKeys: Object.keys(serverRoutesData || {}),
    //   updateDayPolylinePathsProvided: typeof updateDayPolylinePaths === 'function',
    // });
  }
  
  return {
    map: mapRef.current,
    mapContainer: mapContainerRef,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers: addMarkersFromHook,
    calculateRoutes: calculateRoutesFromHook,
    clearMarkersAndUiElements: clearMarkersAndUiElementsFromHook,
    panTo,
    showGeoJson,
    toggleGeoJsonVisibility,
    renderItineraryRoute,
    clearAllRoutes: clearAllDrawnRoutes, 
    handleGeoJsonLoaded,
    highlightSegment, 
    clearPreviousHighlightedPath, 
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex,
    renderGeoJsonRoute, 
    geoJsonNodes,
    geoJsonLinks,
    serverRoutesData,
    setServerRoutes: setAllServerRoutesData,
    updateDayPolylinePaths,
  };
};

export default useMapCore;
