
import React, { createContext, useContext } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import useMapCore from './useMapCore'; // Assuming useMapCore is in the same directory
import { ServerRouteResponse } from '@/types/schedule';

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
  calculateRoutes: () => void; // Kept as () => void as per useMapFeatures's deprecation message
  clearMarkersAndUiElements: () => void;
  panTo: (locationOrCoords: string | {lat: number, lng: number}) => void;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: ( // Ensure this signature is correct
    itineraryDay: ItineraryDay | null, 
    allServerRoutes?: Record<number, ServerRouteResponse>, 
    onComplete?: () => void, 
    onClear?: () => void
  ) => void;
  clearAllRoutes: () => void;
  handleGeoJsonLoaded: (nodes: any[], links: any[]) => void;
  highlightSegment: (fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => void;
  clearPreviousHighlightedPath: () => void;
  isGeoJsonLoaded: boolean;
  checkGeoJsonMapping: (places: Place[]) => {
    totalPlaces: number;
    mappedPlaces: number;
    mappingRate: string;
    averageDistance: number | string; // Can be string 'N/A'
    success: boolean;
    message: string;
  };
  mapPlacesWithGeoNodes: (places: Place[]) => Place[];
  showRouteForPlaceIndex: (placeIndex: number, itineraryDay: ItineraryDay) => void;
  renderGeoJsonRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
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
  calculateRoutes: () => {},
  clearMarkersAndUiElements: () => {},
  panTo: () => {},
  showGeoJson: false,
  toggleGeoJsonVisibility: () => {},
  // Corrected default signature for renderItineraryRoute
  renderItineraryRoute: (itineraryDay, allServerRoutes, onComplete, onClear) => {}, 
  clearAllRoutes: () => {},
  handleGeoJsonLoaded: (nodes, links) => {},
  highlightSegment: (fromIndex, toIndex, itineraryDay) => {},
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
  showRouteForPlaceIndex: (placeIndex, itineraryDay) => {},
  renderGeoJsonRoute: (nodeIds, linkIds, style) => [],
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: (dayRoutes) => {},
  serverRoutesData: {}
};

const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCoreValues = useMapCore(); // Renamed to avoid conflict if mapCore was used directly
  
  // Debug output for GeoJSON loading
  console.log("[MapProvider] MapContext 제공 상태:", {
    isMapInitialized: mapCoreValues.isMapInitialized,
    isNaverLoaded: mapCoreValues.isNaverLoaded,
    isGeoJsonLoaded: mapCoreValues.isGeoJsonLoaded,
    geoJsonNodesCount: mapCoreValues.geoJsonNodes?.length || 0,
    geoJsonLinksCount: mapCoreValues.geoJsonLinks?.length || 0,
    serverRoutesDataCount: Object.keys(mapCoreValues.serverRoutesData || {}).length || 0
  });
  
  return (
    <MapContext.Provider value={mapCoreValues}>
      {children}
    </MapContext.Provider>
  );
};
