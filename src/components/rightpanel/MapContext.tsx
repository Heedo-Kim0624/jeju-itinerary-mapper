
import React, { createContext, useContext } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import useMapCore from './useMapCore'; // useMapCore 임포트
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
    currentItineraryDayData: ItineraryDay // 세 번째 인자 추가
  ) => void;
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
    totalPlaces: places.length,
    mappedPlaces: 0,
    mappingRate: '0%',
    averageDistance: 'N/A',
    success: false,
    message: 'GeoJSON 데이터가 로드되지 않았습니다.'
  }),
  mapPlacesWithGeoNodes: (places) => places,
  showRouteForPlaceIndex: () => {},
  renderGeoJsonRoute: () => {},
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: () => {},
  serverRoutesData: {},
  updateDayPolylinePaths: () => {}, // 시그니처는 MapContextType을 따르지만, 구현은 여전히 no-op
};

const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCoreValues = useMapCore();

  const contextValue = mapCoreValues as unknown as MapContextType;

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
    });
    if (typeof contextValue.updateDayPolylinePaths !== 'function') {
        console.warn("[MapProvider] updateDayPolylinePaths 함수가 context에 제공되지 않았습니다. useMapCore 반환값을 확인하세요.");
    }
  }

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

