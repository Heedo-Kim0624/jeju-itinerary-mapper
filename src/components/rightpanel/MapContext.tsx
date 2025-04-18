
import React, { createContext, useContext } from 'react';
import { Place } from '@/types/supabase';

interface MapContextType {
  map: any;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  isMapError: boolean;
  addMarkers: (places: Place[], opts?: { highlight?: boolean; isItinerary?: boolean }) => void;
  calculateRoutes: (places: Place[]) => void;
  clearMarkersAndUiElements: () => void;
  panTo: (locationOrCoords: string | {lat: number, lng: number}) => void;
}

const defaultContext: MapContextType = {
  map: null,
  isMapInitialized: false,
  isNaverLoaded: false,
  isMapError: false,
  addMarkers: () => {},
  calculateRoutes: () => {},
  clearMarkersAndUiElements: () => {},
  panTo: () => {}
};

const MapContext = createContext<MapContextType>(defaultContext);

export const MapProvider = MapContext.Provider;

export const useMapContext = () => useContext(MapContext);
