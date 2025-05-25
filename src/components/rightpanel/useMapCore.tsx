import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadNaverMapsScript } from '@/utils/map/mapInitializer';
import { initializeMap, createNaverLatLng, naverMapsSetup } from '@/utils/map/mapSetup';
import { panToPosition, fitBoundsToPlaces } from '@/utils/map/mapViewControls';
import { useMapResize } from '@/hooks/useMapResize';
import { useGeoJsonLayer } from '@/components/rightpanel/geojson/useGeoJsonData';
import { useRouteManager } from '@/hooks/map/useRouteManager';
import { useMapMarkersLegacy } from '@/hooks/map/useMapMarkersLegacy'; // 경로 변경
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { SegmentRoute } from '@/types/schedule';
import { useServerRoutes } from '@/hooks/map/useServerRoutes';
import { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
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
  } = usePlaceGeoJsonMapper(geoJsonNodes);

  const {
    addMarkers: addMarkersFromHook,
    clearMarkersAndUiElements: clearMarkersAndUiElementsFromHook,
    calculateRoutes: calculateRoutesFromHook,
  } = useMapMarkersLegacy(mapRef.current); // 변경된 훅 이름 사용

  const { 
    serverRoutesData, 
    setServerRoutes, 
    updateDayPolylinePaths,
    // getDayPolylinePaths // If you need to retrieve paths
  } = useServerRoutes(mapRef.current);


  const {
    renderItineraryRoute,
    renderGeoJsonRoute, // Renamed from renderSegmentedRoute for clarity
    highlightSegment, // Renamed from highlightRouteSegment
    clearPreviousHighlightedPath, // Renamed from clearHighlightedSegmentPath
    clearAllDrawnRoutes, // Renamed from clearAllRoutes
    calculateAndDrawDirectRoutes,
  } = useRouteManager({
    map: mapRef.current,
    isNaverLoadedParam: isNaverLoaded,
    geoJsonNodes: geoJsonNodes,
    mapPlacesWithGeoNodesFn: mapPlacesWithGeoNodes,
    updateDayPolylinePaths: updateDayPolylinePaths,
  });
  
  useEffect(() => {
    const init = async () => {
      try {
        await loadNaverMapsScript();
        setIsNaverLoaded(true);
        if (mapContainerRef.current && !mapRef.current) {
          const naver = window.naver;
          if (naver && naver.maps) {
            const mapInstance = initializeMap(mapContainerRef.current, MAP_ID);
            mapRef.current = mapInstance;
            setIsMapInitialized(true);
            naverMapsSetup(mapInstance); // 초기 네이버 지도 설정 적용
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
        // Geocoding logic would be needed here if 'locationOrCoords' is an address string
        // For now, assuming it's not an address string or this part is handled elsewhere.
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
      seg => seg.fromIndex === placeIndex || seg.toIndex === placeIndex + 1 // This logic might need adjustment based on how segments are defined
    );

    if (segment) {
      console.log(`[useMapCore] Highlighting segment for place index ${placeIndex}:`, segment);
      highlightSegment(segment); // Use the renamed function
    } else {
      console.log(`[useMapCore] No specific segment found for place index ${placeIndex}, clearing previous highlight.`);
      clearPreviousHighlightedPath(); // Use the renamed function
    }
    if (onComplete) onComplete();
  }, [highlightSegment, clearPreviousHighlightedPath, isMapInitialized]);


  // Expose serverRoutesData in the context
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
    clearAllRoutes: clearAllDrawnRoutes, // Use the renamed function from useRouteManager
    handleGeoJsonLoaded,
    highlightSegment, // Expose renamed function
    clearPreviousHighlightedPath, // Expose renamed function
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex,
    renderGeoJsonRoute, // Expose renamed function
    geoJsonNodes,
    geoJsonLinks,
    serverRoutesData,
    setServerRoutes,
    updateDayPolylinePaths,
  };
};

export default useMapCore;
