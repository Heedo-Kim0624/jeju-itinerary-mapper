import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
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

  const [currentRenderingDay, setCurrentRenderingDay] = useState<number | null>(null);
  const [renderingComplete, setRenderingComplete] = useState({
    route: false,
    markers: false
  });
  
  const startDayRendering = useCallback((day: number | null) => {
    console.log(`[MapProvider] Starting rendering process for day: ${day} (from MapContext)`);
    setCurrentRenderingDay(day); // 중요: currentRenderingDay를 여기서 설정해야 이벤트 발생 시 올바른 day 값 사용
    setRenderingComplete({ route: false, markers: false });
    
    if (mapCoreValues.clearAllRoutes) {
        console.log(`[MapProvider] Calling clearAllRoutes for day ${day}`);
        mapCoreValues.clearAllRoutes();
    }
    if (mapCoreValues.clearMarkersAndUiElements) {
        console.log(`[MapProvider] Calling clearMarkersAndUiElements for day ${day}`);
        mapCoreValues.clearMarkersAndUiElements();
    }
    
    // clearAllRoutes 와 clearMarkersAndUiElements가 동기적으로 실행되므로,
    // 바로 이어서 dayRenderingStarted 이벤트를 발생시켜도 됩니다.
    // 만약 해당 함수들이 비동기라면, 완료된 후 이벤트를 발생시켜야 합니다.
    window.dispatchEvent(new CustomEvent('dayRenderingStarted', { detail: { day } }));
    console.log(`[MapProvider] Dispatched 'dayRenderingStarted' for day ${day}. CurrentRenderingDay is now: ${day}`);
  }, [mapCoreValues.clearAllRoutes, mapCoreValues.clearMarkersAndUiElements]); // setCurrentRenderingDay 제거, currentRenderingDay 의존성 제거
  
  const handleRouteRenderingCompleteForContext = useCallback(() => {
    // 이 시점의 currentRenderingDay가 중요
    console.log(`[MapProvider] Route rendering completed for day: ${currentRenderingDay} (received in MapContext)`);
    setRenderingComplete(prev => ({ ...prev, route: true }));
    
    // 이벤트 발생 시점의 currentRenderingDay 값 사용
    window.dispatchEvent(new CustomEvent('routeRenderingCompleteInternal', { 
      detail: { day: currentRenderingDay, source: 'MapContext' } 
    }));
    console.log(`[MapProvider] Dispatched 'routeRenderingCompleteInternal' for day ${currentRenderingDay}`);
  }, [currentRenderingDay]); // currentRenderingDay 의존성 추가
  
  const handleMarkerRenderingCompleteForContext = useCallback(() => {
    console.log(`[MapProvider] Marker rendering completed for day: ${currentRenderingDay} (received in MapContext)`);
    setRenderingComplete(prev => {
      const newState = { ...prev, markers: true };
      if (newState.route && newState.markers) {
        console.log(`[MapProvider] All rendering completed for day: ${currentRenderingDay}`);
        window.dispatchEvent(new CustomEvent('dayRenderingCompleted', { 
          detail: { day: currentRenderingDay } 
        }));
        console.log(`[MapProvider] Dispatched 'dayRenderingCompleted' for day ${currentRenderingDay}`);
      }
      return newState;
    });
  }, [currentRenderingDay]); // currentRenderingDay 의존성 추가 및 renderingComplete.route 제거

  // ... keep existing code (contextValue definition and return statement)
  // ... useEffect for logging can be kept or removed
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
