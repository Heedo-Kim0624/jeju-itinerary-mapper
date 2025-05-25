import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import useMapCore from './useMapCore';
import { SegmentRoute } from '@/types/schedule';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface MapContextType {
  map: any;
  mapContainer: React.RefObject<HTMLDivElement>;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  isMapError: boolean;
  addMarkers: (places: Place[], opts?: {
    highlight?: boolean;
    isItinerary?: boolean;
    useRecommendedStyle?: boolean;
    useColorByCategory?: boolean;
    onClick?: (place: Place, index: number) => void;
  }) => any[];
  calculateRoutes: (placesToRoute: Place[]) => void;
  clearMarkersAndUiElements: () => void;
  panTo: (locationOrCoords: string | {lat: number, lng: number}) => void;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => void;
  clearAllRoutes: () => void;
  handleGeoJsonLoaded: (nodes: any[], links: any[]) => void;
  highlightSegment: (segment: SegmentRoute | null) => void;
  clearPreviousHighlightedPath: () => void;
  isGeoJsonLoaded: boolean;
  checkGeoJsonMapping: (places: Place[]) => {
    totalPlaces: number;
    mappedPlaces: number;
    mappingRate: string;
    averageDistance: number | string;
    success: boolean;
    message: string;
  };
  mapPlacesWithGeoNodes: (places: Place[]) => Place[];
  showRouteForPlaceIndex: (placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => void;
  renderGeoJsonRoute: (route: SegmentRoute) => void;
  geoJsonNodes: any[];
  geoJsonLinks: any[];
  setServerRoutes: (
    dayRoutes: Record<number, ServerRouteDataForDay> |
               ((prevRoutes: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay>;
  updateDayPolylinePaths: (
    day: number,
    polylinePaths: { lat: number; lng: number }[][],
    currentItineraryDayData: ItineraryDay 
  ) => void;

  // 중앙 집중식 상태 관리 추가
  currentRenderingDay: number | null;
  startDayRendering: (day: number | null) => void;
  handleRouteRenderingCompleteForContext: () => void; // Renamed to avoid conflict if MapContext itself uses it
  handleMarkerRenderingCompleteForContext: () => void; // Renamed
  renderingComplete: { route: boolean; markers: boolean };
}

const defaultContext: MapContextType = {
  map: null,
  mapContainer: { current: null } as React.RefObject<HTMLDivElement>,
  isMapInitialized: false,
  isNaverLoaded: false,
  isMapError: false,
  addMarkers: () => [],
  calculateRoutes: () => {},
  clearMarkersAndUiElements: () => {},
  panTo: () => {},
  showGeoJson: false,
  toggleGeoJsonVisibility: () => {},
  renderItineraryRoute: () => {},
  clearAllRoutes: () => {},
  handleGeoJsonLoaded: () => {},
  highlightSegment: () => {},
  clearPreviousHighlightedPath: () => {},
  isGeoJsonLoaded: false,
  checkGeoJsonMapping: (places) => ({
    totalPlaces: places.length, mappedPlaces: 0, mappingRate: '0%', averageDistance: 'N/A', success: false, message: 'GeoJSON 데이터가 로드되지 않았습니다.'
  }),
  mapPlacesWithGeoNodes: (places) => places,
  showRouteForPlaceIndex: () => {},
  renderGeoJsonRoute: () => {},
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: () => {},
  serverRoutesData: {},
  updateDayPolylinePaths: () => {},
  currentRenderingDay: null,
  startDayRendering: () => {},
  handleRouteRenderingCompleteForContext: () => {},
  handleMarkerRenderingCompleteForContext: () => {},
  renderingComplete: { route: false, markers: false },
};

const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCoreValues = useMapCore();

  // 일자별 렌더링 상태 추가
  const [currentRenderingDay, setCurrentRenderingDay] = useState<number | null>(null);
  const [renderingComplete, setRenderingComplete] = useState({
    route: false,
    markers: false
  });
  
  const startDayRendering = useCallback((day: number | null) => {
    console.log(`[MapProvider] Starting rendering process for day: ${day}`);
    setCurrentRenderingDay(day);
    setRenderingComplete({ route: false, markers: false });
    
    // MapCore에서 제공하는 함수 사용
    if (mapCoreValues.clearAllRoutes) mapCoreValues.clearAllRoutes();
    if (mapCoreValues.clearMarkersAndUiElements) mapCoreValues.clearMarkersAndUiElements();
    
    window.dispatchEvent(new CustomEvent('dayRenderingStarted', { detail: { day } }));
  }, [mapCoreValues.clearAllRoutes, mapCoreValues.clearMarkersAndUiElements]);
  
  const handleRouteRenderingCompleteForContext = useCallback(() => {
    console.log(`[MapProvider] Route rendering completed for day: ${currentRenderingDay}`);
    setRenderingComplete(prev => ({ ...prev, route: true }));
    
    window.dispatchEvent(new CustomEvent('routeRenderingCompleteInternal', { 
      detail: { day: currentRenderingDay, source: 'MapContext' } 
    }));
  }, [currentRenderingDay]);
  
  const handleMarkerRenderingCompleteForContext = useCallback(() => {
    console.log(`[MapProvider] Marker rendering completed for day: ${currentRenderingDay}`);
    setRenderingComplete(prev => {
      const newState = { ...prev, markers: true };
      if (newState.route && newState.markers) {
        console.log(`[MapProvider] All rendering completed for day: ${currentRenderingDay}`);
        window.dispatchEvent(new CustomEvent('dayRenderingCompleted', { 
          detail: { day: currentRenderingDay } 
        }));
      }
      return newState;
    });
  }, [currentRenderingDay]); // renderingComplete.route was removed from deps, check if it's ok

  const contextValue = useMemo(() => ({
    ...mapCoreValues,
    currentRenderingDay,
    startDayRendering,
    handleRouteRenderingCompleteForContext,
    handleMarkerRenderingCompleteForContext,
    renderingComplete
  }), [
    mapCoreValues,
    currentRenderingDay,
    startDayRendering,
    handleRouteRenderingCompleteForContext,
    handleMarkerRenderingCompleteForContext,
    renderingComplete
  ]);
  
  if (process.env.NODE_ENV === 'development') {
    console.log("[MapProvider] 제공되는 Context 값:", {
      isMapInitialized: contextValue.isMapInitialized,
      isNaverLoaded: contextValue.isNaverLoaded,
      isGeoJsonLoaded: contextValue.isGeoJsonLoaded,
      geoJsonNodesCount: contextValue.geoJsonNodes?.length || 0,
      geoJsonLinksCount: contextValue.geoJsonLinks?.length || 0,
      serverRoutesDataKeys: Object.keys(contextValue.serverRoutesData || {}),
      hasRenderItineraryRoute: typeof contextValue.renderItineraryRoute === 'function',
      hasUpdateDayPolylinePaths: typeof contextValue.updateDayPolylinePaths === 'function',
      hasSetServerRoutes: typeof contextValue.setServerRoutes === 'function',
      currentRenderingDay: contextValue.currentRenderingDay,
      renderingComplete: contextValue.renderingComplete,
      hasStartDayRendering: typeof contextValue.startDayRendering === 'function',
    });
    if (typeof contextValue.updateDayPolylinePaths !== 'function') {
        console.warn("[MapProvider] updateDayPolylinePaths 함수가 context에 제공되지 않았습니다. useMapCore 반환값을 확인하세요.");
    }
  }

  return (
    <MapContext.Provider value={contextValue as unknown as MapContextType}>
      {children}
    </MapContext.Provider>
  );
};
