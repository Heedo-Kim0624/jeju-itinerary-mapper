
import React, { createContext, useContext, useRef, Dispatch, SetStateAction } from 'react';
import { Place } from '@/types/supabase';
import { ItineraryDay, ItineraryPlace } from '@/types/itinerary'; // ItineraryDay here has ItineraryPlace[]
// Changed import from default to named
import { useMapCore } from './useMapCore'; 
import { ServerRouteResponse } from '@/types/schedule';
import { 
  renderGeoJsonRoute, 
  renderItineraryRoute as renderItineraryRouteExtension, // Renamed to avoid conflict
  clearPreviousHighlightedPath,
  showRouteForPlaceIndex,
  highlightSegment,
  renderAllNetwork
} from './mapCoreExtensions';

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
  calculateRoutes: (places: Place[]) => void; // Added
  clearMarkersAndUiElements: () => void;
  panTo: (placeOrCoords: Place | ItineraryPlace | { lat: number; lng: number }) => void; // Updated signature
  showGeoJson: boolean;
  toggleGeoJsonVisibility: () => void;
  renderItineraryRoute: (itineraryDay: ItineraryDay | null) => void;
  clearAllRoutes: () => void;
  handleGeoJsonLoaded: (nodes: any[], links: any[]) => void;
  highlightSegment: (fromIndex: number, toIndex: number, itineraryDay?: ItineraryDay) => void;
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
  showRouteForPlaceIndex: (placeIndex: number, itineraryDay: ItineraryDay) => void;
  renderGeoJsonRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
  renderAllNetwork: (style?: any) => any[];
  geoJsonNodes: any[];
  geoJsonLinks: any[];
  setServerRoutes: (dayRoutes: Record<number, ServerRouteResponse>) => void; // Added
  serverRoutesData: Record<number, ServerRouteResponse>; // Added
  setMapScriptLoaded: (loaded: boolean) => void;
  drawItineraryRoute: (daySchedule: ItineraryDay | null) => void;
  addItineraryDayMarkers: (daySchedule: ItineraryDay | null) => void;
}

const defaultContextValue: MapContextType = {
  map: null,
  mapContainer: { current: null } as React.RefObject<HTMLDivElement>,
  isMapInitialized: false,
  isNaverLoaded: false,
  isMapError: false,
  addMarkers: () => [],
  calculateRoutes: () => { console.warn("calculateRoutes not implemented in default context"); }, // Added default
  clearMarkersAndUiElements: () => {},
  panTo: () => { console.warn("panTo not implemented in default context"); }, // Updated default
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
  renderAllNetwork: () => [], 
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: () => { console.warn("setServerRoutes not implemented in default context"); }, // Added default
  serverRoutesData: {}, // Added default
  setMapScriptLoaded: () => {},
  drawItineraryRoute: () => {},
  addItineraryDayMarkers: () => {},
};


const MapContext = createContext<MapContextType>(defaultContextValue);

export const useMapContext = () => useContext(MapContext);

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const mapCoreValues = useMapCore({ 
    // Props for useMapCore, if any, go here
  });
  
  const extendedMapCore: MapContextType = {
    ...defaultContextValue, 
    ...mapCoreValues, 
    mapContainer: mapCoreValues.mapContainerRef, 
    isMapInitialized: !!mapCoreValues.map,
    panTo: mapCoreValues.panTo, // Ensure panTo from useMapCore is used
    renderGeoJsonRoute, // This is the extension
    renderItineraryRoute: (itineraryDay: ItineraryDay | null) => {
      // Assuming this should call the extension or a method from useMapCore
      // If useMapCore has drawItineraryRoute, that might be what's intended here
      // For now, using the extension:
      renderItineraryRouteExtension(itineraryDay); 
    },
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    highlightSegment,
    renderAllNetwork,
    // Explicitly assign properties that might be missing or need defaults from mapCoreValues
    addMarkers: mapCoreValues.addMarkers || defaultContextValue.addMarkers,
    calculateRoutes: mapCoreValues.calculateRoutes || defaultContextValue.calculateRoutes,
    setServerRoutes: mapCoreValues.setServerRoutes || defaultContextValue.setServerRoutes,
    serverRoutesData: mapCoreValues.serverRoutesData || defaultContextValue.serverRoutesData,
    drawItineraryRoute: mapCoreValues.drawItineraryRoute || defaultContextValue.drawItineraryRoute,
    addItineraryDayMarkers: mapCoreValues.addItineraryDayMarkers || defaultContextValue.addItineraryDayMarkers,

  };
  
  return (
    <MapContext.Provider value={extendedMapCore}>
      {children}
    </MapContext.Provider>
  );
};

