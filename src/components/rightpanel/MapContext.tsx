
import React, { createContext, useContext } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import useMapCore from './useMapCore';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule';

interface MapContextType {
  map: any;
  mapContainer: React.RefObject<HTMLDivElement>;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  isMapError: boolean;
  addMarkers: (
    placesToAdd: Place[], 
    options?: {
      highlightPlaceId?: string;
      isItinerary?: boolean;
      useRecommendedStyle?: boolean;
      useColorByCategory?: boolean;
      onMarkerClick?: (place: Place, index: number) => void; 
      itineraryOrder?: boolean;
    }
  ) => any[];
  calculateRoutes: (placesToRoute: Place[]) => void;
  clearAllMapElements: () => void;
  clearAllRoutes: () => void;
  clearAllMarkers: () => void;
  panTo: (locationOrCoords: string | {lat: number, lng: number}) => void;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: (
    itineraryDay: ItineraryDay | null, 
    allServerRoutes?: Record<number, ServerRouteResponse>, 
    onComplete?: () => void
  ) => void;
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
  renderGeoJsonRoute: (
    itineraryDay: ItineraryDay | null, 
    allServerRoutes?: Record<number, ServerRouteResponse>, 
    onComplete?: () => void
  ) => void;
  geoJsonNodes: any[];
  geoJsonLinks: any[];
  setServerRoutes: (
    dayRoutes: Record<number, ServerRouteResponse> | 
               ((prevRoutes: Record<number, ServerRouteResponse>) => Record<number, ServerRouteResponse>)
  ) => void;
  serverRoutesData: Record<number, ServerRouteResponse>;
}

const defaultContextValue: MapContextType = {
  map: null,
  mapContainer: { current: null } as React.RefObject<HTMLDivElement>,
  isMapInitialized: false,
  isNaverLoaded: false,
  isMapError: false,
  addMarkers: () => [],
  calculateRoutes: () => {},
  clearAllMapElements: () => {},
  clearAllRoutes: () => {},
  clearAllMarkers: () => {},
  panTo: () => {},
  showGeoJson: false,
  toggleGeoJsonVisibility: () => {},
  renderItineraryRoute: () => {}, 
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
  serverRoutesData: {}
};

const MapContext = createContext<MapContextType>(defaultContextValue);

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
    highlightSegmentType: typeof mapCoreValues.highlightSegment 
  });
  
  return (
    <MapContext.Provider value={mapCoreValues}>
      {children}
    </MapContext.Provider>
  );
};
