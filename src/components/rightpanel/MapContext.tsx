import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Place, ItineraryDay } from '@/types/core';
import useMapCore from './useMapCore';
import { SegmentRoute } from '@/types/core/route-data';
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
  handleRouteRenderingCompleteForContext: () => void;
  handleMarkerRenderingCompleteForContext: () => void; 
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
  
  // 중요: 일자 변경 시 렌더링 시작하는 함수
  const startDayRendering = useCallback((day: number | null) => {
    console.log(`[MapProvider] Starting rendering process for day: ${day} (from MapContext)`);
    
    // 이전 상태 초기화
    setRenderingComplete({ route: false, markers: false });
    setCurrentRenderingDay(day);
    
    // 지도 요소 초기화
    if (mapCoreValues.clearAllRoutes) {
      console.log(`[MapProvider] Clearing all routes for day ${day}`);
      mapCoreValues.clearAllRoutes();
    }
    if (mapCoreValues.clearMarkersAndUiElements) {
      console.log(`[MapProvider] Clearing all markers for day ${day}`);
      mapCoreValues.clearMarkersAndUiElements();
    }
    
    // 일자 렌더링 시작 이벤트 발생
    const renderingStartEvent = new CustomEvent('dayRenderingStarted', { 
      detail: { day } 
    });
    window.dispatchEvent(renderingStartEvent);
    console.log(`[MapProvider] Dispatched 'dayRenderingStarted' event for day ${day}`);
    
    // 선택된 일자의 경로 렌더링 시작
    if (day !== null && mapCoreValues.renderItineraryRoute) {
      // renderItineraryRoute를 직접 호출하지 않고, 이벤트를 통해 처리
      // 이렇게 하면 useMapDataEffects에서 selectedDay 변경을 감지하여 렌더링 진행
      console.log(`[MapProvider] Routing will be triggered by 'itineraryDaySelected' event for day ${day}`);
    }
    
  }, [mapCoreValues.clearAllRoutes, mapCoreValues.clearMarkersAndUiElements, mapCoreValues.renderItineraryRoute]);
  
  // 경로 렌더링 완료 시 호출되는 함수
  const handleRouteRenderingCompleteForContext = useCallback(() => {
    console.log(`[MapProvider] Route rendering completed for day: ${currentRenderingDay}`);
    setRenderingComplete(prev => ({ ...prev, route: true }));
    
    // 경로 렌더링 완료 이벤트 발생
    window.dispatchEvent(new CustomEvent('routeRenderingCompleteInternal', { 
      detail: { day: currentRenderingDay, source: 'MapContext' } 
    }));
    console.log(`[MapProvider] Dispatched 'routeRenderingCompleteInternal' event for day ${currentRenderingDay}`);
  }, [currentRenderingDay]);
  
  // 마커 렌더링 완료 시 호출되는 함수
  const handleMarkerRenderingCompleteForContext = useCallback(() => {
    console.log(`[MapProvider] Marker rendering completed for day: ${currentRenderingDay}`);
    setRenderingComplete(prev => {
      const newState = { ...prev, markers: true };
      
      // 경로와 마커 모두 완료되었으면 최종 완료 이벤트 발생
      if (newState.route && newState.markers) {
        console.log(`[MapProvider] All rendering completed for day: ${currentRenderingDay}`);
        window.dispatchEvent(new CustomEvent('dayRenderingCompleted', { 
          detail: { day: currentRenderingDay } 
        }));
        console.log(`[MapProvider] Dispatched 'dayRenderingCompleted' event for day ${currentRenderingDay}`);
      }
      
      return newState;
    });
  }, [currentRenderingDay]);

  // Context 값 준비
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

  return (
    <MapContext.Provider value={contextValue as unknown as MapContextType}>
      {children}
    </MapContext.Provider>
  );
};
