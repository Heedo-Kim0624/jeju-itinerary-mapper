
import React, { createContext, useContext } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import useMapCore from './useMapCore';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule'; // SegmentRoute 추가

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
    allServerRoutes?: Record<number, ServerRouteResponse>, 
    onComplete?: () => void
  ) => void;
  clearAllRoutes: () => void;
  handleGeoJsonLoaded: (nodes: any[], links: any[]) => void;
  // highlightSegment 시그니처 수정
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
  renderGeoJsonRoute: (route: SegmentRoute) => void; // Changed return type to void
  geoJsonNodes: any[];
  geoJsonLinks: any[];
  setServerRoutes: (
    dayRoutes: Record<number, ServerRouteResponse> | 
               ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => void;
  serverRoutesData: Record<number, ServerRouteResponse>;
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
  // highlightSegment 기본값 수정
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
  // Changed return type to void
  renderGeoJsonRoute: (route) => {}, 
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: (dayRoutes) => {},
  serverRoutesData: {}
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
    serverRoutesDataCount: Object.keys(mapCoreValues.serverRoutesData || {}).length || 0,
    highlightSegmentType: typeof mapCoreValues.highlightSegment // 타입 확인용
  });
  
  return (
    <MapContext.Provider value={mapCoreValues}>
      {children}
    </MapContext.Provider>
  );
};
