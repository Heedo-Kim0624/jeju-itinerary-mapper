import { createContext, useContext } from 'react';

export interface MapContextType {
  centerMapToMarkers: () => void;
  // Add other map-related functions and state as needed
}

const defaultContext: MapContextType = {
  centerMapToMarkers: () => {},
};

export const MapContext = createContext<MapContextType>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export default MapContext;
