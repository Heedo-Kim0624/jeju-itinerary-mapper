
import React, { createContext, useContext, useRef } from 'react';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/types/itinerary';
// Changed import from default to named
import { useMapCore } from './useMapCore'; 
import { ServerRouteResponse } from '@/types/schedule';
import { 
  renderGeoJsonRoute, 
  renderItineraryRoute, 
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
  calculateRoutes: (places: Place[]) => void;
  clearMarkersAndUiElements: () => void;
  panTo: (locationOrCoords: string | {lat: number, lng: number}) => void;
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
  // 서버 경로 관련 기능 추가
  setServerRoutes: (dayRoutes: Record<number, ServerRouteResponse>) => void;
  serverRoutesData: Record<number, ServerRouteResponse>;
  // Properties from useMapCore
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
  calculateRoutes: () => {},
  clearMarkersAndUiElements: () => {},
  panTo: () => {},
  showGeoJson: false,
  toggleGeoJsonVisibility: () => {},
  renderItineraryRoute: () => {}, // Placeholder, will be overridden
  clearAllRoutes: () => {},
  handleGeoJsonLoaded: () => {},
  highlightSegment: () => {}, // Placeholder
  clearPreviousHighlightedPath: () => {}, // Placeholder
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
  showRouteForPlaceIndex: () => {}, // Placeholder
  renderGeoJsonRoute: () => [], // Placeholder
  renderAllNetwork: () => [], // Placeholder
  geoJsonNodes: [],
  geoJsonLinks: [],
  setServerRoutes: () => {},
  serverRoutesData: {},
  // from useMapCore
  setMapScriptLoaded: () => {},
  drawItineraryRoute: () => {},
  addItineraryDayMarkers: () => {},
};


const MapContext = createContext<MapContextType>(defaultContextValue);

export const useMapContext = () => useContext(MapContext);

// Create a provider component that uses the useMapCore hook
export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // useMapCore returns an object with specific properties.
  // We need to ensure MapContextType matches what useMapCore provides + extensions.
  const mapCoreValues = useMapCore({ 
    // Provide default or actual props for useMapCore if needed
    // For example:
    // places: [],
    // setSelectedPlace: () => {},
    // serverRoutesData: {}, 
    // loadGeoJsonData: false,
  });
  
  const extendedMapCore = {
    ...defaultContextValue, // Start with defaults to ensure all keys are present
    ...mapCoreValues, // Spread values from the hook
    mapContainer: mapCoreValues.mapContainerRef, // mapContainerRef is the actual ref object from useMapCore
    isMapInitialized: !!mapCoreValues.map, // A simple way to check if map is initialized
    // Add specific functions if they are not directly on mapCoreValues or need aliasing
    renderGeoJsonRoute,
    renderItineraryRoute: (itineraryDay: ItineraryDay | null) => {
      // Potentially use mapCoreValues.drawItineraryRoute or custom logic here
      // This example assumes mapCoreExtensions.renderItineraryRoute is preferred
      renderItineraryRoute(itineraryDay); 
    },
    clearPreviousHighlightedPath,
    showRouteForPlaceIndex,
    highlightSegment,
    renderAllNetwork,
    // Assuming setServerRoutes and serverRoutesData are managed within useMapCore or context state not shown
    // If they are part of useMapCore, they should be spread correctly.
    // If not, they need to be managed here (e.g. with useState)
  };
  
  return (
    <MapContext.Provider value={extendedMapCore}>
      {children}
    </MapContext.Provider>
  );
};

