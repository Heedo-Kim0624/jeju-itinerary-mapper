
import React, { createContext, useContext } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import useMapCore from './useMapCore';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule'; // SegmentRoute는 유지, ServerRouteResponse는 점진적으로 ServerRouteDataForDay로 대체될 것
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes'; // ServerRouteDataForDay 임포트

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
    allServerRoutes?: Record<number, ServerRouteDataForDay>, // 타입 변경
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
  setServerRoutes: ( // 타입 변경
    dayRoutes: Record<number, ServerRouteDataForDay> | 
               ((prevRoutes: Record<number, ServerRouteDataForDay>) => Record<number, ServerRouteDataForDay>)
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay>; // 타입 변경
}

const defaultContext: MapContextType = {
  map: null,
  mapContainer: { current: null } as React.RefObject<HTMLDivElement>,
  isMapInitialized: false,
  isNaverLoaded: false,
  isMapError: false,
  addMarkers: () => [],
  calculateRoutes: (placesToRoute: Place[]) => {},
  clearMarkersAndUiElements: () => {},
  panTo: () => {},
  showGeoJson: false,
  toggleGeoJsonVisibility: () => {},
  renderItineraryRoute: (itineraryDay, allServerRoutes, onComplete) => {}, 
  clearAllRoutes: () => {},
  handleGeoJsonLoaded: (nodes, links) => {},
  highlightSegment: (segment) => {}, 
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
  showRouteForPlaceIndex: (placeIndex, itineraryDay, onComplete) => {},
  renderGeoJsonRoute: (route) => {}, 
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: (dayRoutes) => {}, // 시그니처는 타입 정의를 따름
  serverRoutesData: {} // 타입은 Record<number, ServerRouteDataForDay>
};

const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCoreValues = useMapCore(); 
  
  // Debug output for GeoJSON loading
  console.log("[MapProvider] MapContext 제공 상태:", {
    isMapInitialized: mapCoreValues.isMapInitialized,
    isNaverLoaded: mapCoreValues.isNaverLoaded,
    isGeoJsonLoaded: mapCoreValues.isGeoJsonLoaded,
    geoJsonNodesCount: mapCoreValues.geoJsonNodes?.length || 0,
    geoJsonLinksCount: mapCoreValues.geoJsonLinks?.length || 0,
    // serverRoutesData의 타입이 변경되었으므로, mapCoreValues에서 오는 실제 데이터 구조와 일치하는지 확인 필요
    // 만약 mapCoreValues.serverRoutesData가 여전히 ServerRouteResponse 형태라면 추가 변환 또는 useMapCore 수정 필요
    // 여기서는 MapContextType 정의에 맞춰 mapCoreValues가 ServerRouteDataForDay 형태로 제공한다고 가정
    serverRoutesDataCount: Object.keys(mapCoreValues.serverRoutesData || {}).length || 0,
    highlightSegmentType: typeof mapCoreValues.highlightSegment
  });
  
  return (
    // @ts-ignore TODO: useMapCore가 반환하는 값의 serverRoutesData 타입을 ServerRouteDataForDay로 맞춰야 함.
    // 현재 useMapCore는 read-only이므로, 임시로 @ts-ignore 처리. 근본적으로는 useMapCore 수정 필요.
    <MapContext.Provider value={mapCoreValues}>
      {children}
    </MapContext.Provider>
  );
};

