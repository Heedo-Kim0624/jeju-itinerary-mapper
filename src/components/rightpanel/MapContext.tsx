
import React, { createContext, useContext, MutableRefObject } from 'react'; // Added MutableRefObject
import { Place, ItineraryDay, SelectedPlace } from '@/types/core'; // Updated to use core types
import useMapCore from './useMapCore';
import { ServerRouteResponse, SegmentRoute } from '@/types/schedule'; 

interface MapContextType {
  map: any;
  mapContainer: MutableRefObject<HTMLDivElement | null>; // Ensure HTMLDivElement | null
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  isMapError: boolean;
  addMarkers: (places: Place[], opts?: { 
    highlight?: boolean; 
    isItinerary?: boolean; 
    useRecommendedStyle?: boolean;
    useColorByCategory?: boolean;
    onClick?: (place: Place, index: number) => void; // Make sure Place here is Place from core
  }) => any[];
  calculateRoutes: (placesToRoute: Place[]) => void; // Make sure Place here is Place from core
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
  highlightSegment: (segment: SegmentRoute | null) => void;
  clearPreviousHighlightedPath: () => void;
  isGeoJsonLoaded: boolean;
  checkGeoJsonMapping: (places: Place[]) => { // Make sure Place here is Place from core
    totalPlaces: number;
    mappedPlaces: number;
    mappingRate: string;
    averageDistance: number | string; 
    success: boolean;
    message: string;
  };
  mapPlacesWithGeoNodes: (places: Place[]) => Place[]; // Make sure Place here is Place from core
  showRouteForPlaceIndex: (placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => void;
  renderGeoJsonRoute: (route: SegmentRoute) => void; 
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
  mapContainer: { current: null } as MutableRefObject<HTMLDivElement | null>,
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
  mapPlacesWithGeoNodes: (places) => places.map(p => ({...p, id: String(p.id)})), // Ensure string IDs
  showRouteForPlaceIndex: () => {},
  renderGeoJsonRoute: () => {}, 
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: () => {},
  serverRoutesData: {}
};

const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCoreValues = useMapCore(); 
  
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
    <MapContext.Provider value={mapCoreValues as MapContextType}> {/* Ensure value matches MapContextType */}
      {children}
    </MapContext.Provider>
  );
};
