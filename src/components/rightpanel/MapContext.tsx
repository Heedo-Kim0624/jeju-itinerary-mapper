
import React, { createContext, useContext, useRef, MutableRefObject } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';
import { useMapCore } from './useMapCore'; // Corrected import
import { ServerRouteResponse, EnrichedItineraryDay, ExtractedRouteData } from '@/types/schedule';
import { GeoJsonLayerRef, GeoNode, GeoLink } from './geojson/GeoJsonTypes';

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
  calculateRoutes: (places: Place[]) => void;
  clearMarkersAndUiElements: () => void;
  removeAllMarkers: () => void; // Added
  panTo: (locationOrCoords: string | {lat: number, lng: number}) => void;
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: (itineraryDay: EnrichedItineraryDay | null) => void; // Updated type
  clearAllRoutes: () => void;
  handleGeoJsonLoaded: (nodes: GeoNode[], links: GeoLink[]) => void; // Updated types
  highlightSegment: (fromIndex: number, toIndex: number, itineraryDay?: EnrichedItineraryDay) => void; // Updated type
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
  showRouteForPlaceIndex: (placeIndex: number, itineraryDay: EnrichedItineraryDay) => void; // Updated type
  renderGeoJsonRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
  geoJsonNodes: GeoNode[]; // Updated type
  geoJsonLinks: GeoLink[]; // Updated type
  setServerRoutes: (dayRoutes: Record<number, ServerRouteResponse>) => void;
  serverRoutesData: Record<number, ServerRouteResponse>;
  geojsonLayerRef: MutableRefObject<GeoJsonLayerRef | null>; // Added
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
  removeAllMarkers: () => {}, // Added
  panTo: () => {},
  showGeoJson: false,
  toggleGeoJsonVisibility: () => {},
  renderItineraryRoute: () => {},
  clearAllRoutes: () => {},
  handleGeoJsonLoaded: () => {},
  highlightSegment: () => {},
  clearPreviousHighlightedPath: () => {},
  isGeoJsonLoaded: false,
  checkGeoJsonMapping: () => ({ 
    totalPlaces: 0, 
    mappedPlaces: 0, 
    mappingRate: '0%', 
    averageDistance: 0,
    success: false,
    message: '초기화되지 않음'
  }),
  mapPlacesWithGeoNodes: (places) => places,
  showRouteForPlaceIndex: () => {},
  renderGeoJsonRoute: () => [],
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: () => {},
  serverRoutesData: {},
  geojsonLayerRef: { current: null } // Added
};

const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

// Create a provider component that uses the useMapCore hook
export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCore = useMapCore();
  
  return (
    <MapContext.Provider value={mapCore}>
      {children}
    </MapContext.Provider>
  );
};
