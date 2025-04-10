
import React, { createContext, useContext, ReactNode } from 'react';
import { Place, ItineraryDay } from '@/types/supabase';

interface MapContextType {
  map: any;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  isMapError: boolean;
  addMarkers: (places: Place[], isItinerary?: boolean) => void;
  calculateRoutes: (places: Place[]) => void;
  clearMarkersAndUiElements: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
  value: MapContextType;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children, value }) => {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapContext = (): MapContextType => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
