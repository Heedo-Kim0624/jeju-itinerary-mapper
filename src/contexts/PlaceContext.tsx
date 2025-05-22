
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchAllPlacesData } from '@/services/placeDataLoader';
import type { DetailedPlace } from '@/types/detailedPlace';

interface PlaceContextType {
  allPlaces: Map<number, DetailedPlace>;
  isLoadingPlaces: boolean;
  errorLoadingPlaces: Error | null;
  getPlaceById: (id: number) => DetailedPlace | undefined;
}

const PlaceContext = createContext<PlaceContextType | undefined>(undefined);

export const PlaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allPlaces, setAllPlaces] = useState<Map<number, DetailedPlace>>(new Map());
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(true);
  const [errorLoadingPlaces, setErrorLoadingPlaces] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingPlaces(true);
        setErrorLoadingPlaces(null);
        console.log('[PlaceProvider] Initializing place data load...');
        const dataMap = await fetchAllPlacesData();
        setAllPlaces(dataMap);
        console.log(`[PlaceProvider] Place data loaded successfully. ${dataMap.size} places in store.`);
      } catch (error) {
        console.error('[PlaceProvider] Error loading all places data:', error);
        setErrorLoadingPlaces(error instanceof Error ? error : new Error('Failed to load places'));
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    loadData();
  }, []);

  const getPlaceById = (id: number): DetailedPlace | undefined => {
    return allPlaces.get(id);
  };

  return (
    <PlaceContext.Provider value={{ allPlaces, isLoadingPlaces, errorLoadingPlaces, getPlaceById }}>
      {children}
    </PlaceContext.Provider>
  );
};

export const usePlaceContext = (): PlaceContextType => {
  const context = useContext(PlaceContext);
  if (context === undefined) {
    throw new Error('usePlaceContext must be used within a PlaceProvider');
  }
  return context;
};

