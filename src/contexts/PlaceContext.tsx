
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Place } from '@/types/supabase'; // Assuming this is the comprehensive Place type
import { fetchAllPlacesDetails } from '@/services/utils/supabasePlaceUtils'; // New utility
import { parseIntId } from '@/utils/id-utils';
import { findMostSimilarString } from '@/utils/stringUtils';

interface PlaceContextType {
  placesMap: Map<number, Place>;
  placeNamesMap: Map<string, number>; // For name-based lookups: maps normalized name to numeric ID
  getPlaceById: (id: number | string | null | undefined) => Place | undefined;
  getPlaceByName: (name: string) => Place | undefined;
  isPlacesLoading: boolean;
  placesError: Error | null;
  loadAllPlaces: () => Promise<void>;
}

const PlaceContext = createContext<PlaceContextType | undefined>(undefined);

export const PlaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [placesMap, setPlacesMap] = useState<Map<number, Place>>(new Map());
  const [placeNamesMap, setPlaceNamesMap] = useState<Map<string, number>>(new Map());
  const [isPlacesLoading, setIsPlacesLoading] = useState<boolean>(true);
  const [placesError, setPlacesError] = useState<Error | null>(null);

  const loadAllPlaces = useCallback(async () => {
    console.log('[PlaceProvider] Initializing and loading all places...');
    setIsPlacesLoading(true);
    setPlacesError(null);
    try {
      const allPlaces = await fetchAllPlacesDetails();
      const newPlacesMap = new Map<number, Place>();
      const newPlaceNamesMap = new Map<string, number>();

      allPlaces.forEach(place => {
        const numericId = parseIntId(place.id);
        if (numericId !== null) {
          newPlacesMap.set(numericId, place);
          // For name-based lookup, store normalized name
          // Consider using normalizePlaceName from stringUtils if available, or a simple toLowerCase()
          const normalizedName = place.name.toLowerCase().replace(/\s+/g, '');
          if (!newPlaceNamesMap.has(normalizedName)) {
            newPlaceNamesMap.set(normalizedName, numericId);
          }
        } else {
          console.warn(`[PlaceProvider] Place "${place.name}" has an invalid ID: ${place.id}. Skipping.`);
        }
      });

      setPlacesMap(newPlacesMap);
      setPlaceNamesMap(newPlaceNamesMap);
      console.log(`[PlaceProvider] Loaded ${newPlacesMap.size} places into the store.`);
    } catch (error) {
      console.error('[PlaceProvider] Error loading all places:', error);
      setPlacesError(error instanceof Error ? error : new Error('Failed to load places'));
    } finally {
      setIsPlacesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllPlaces();
  }, [loadAllPlaces]);

  const getPlaceById = useCallback((id: number | string | null | undefined): Place | undefined => {
    const numericId = parseIntId(id);
    if (numericId === null) return undefined;
    return placesMap.get(numericId);
  }, [placesMap]);

  const getPlaceByName = useCallback((name: string): Place | undefined => {
    if (!name) return undefined;
    // Try direct normalized match first
    const normalizedName = name.toLowerCase().replace(/\s+/g, '');
    const directMatchId = placeNamesMap.get(normalizedName);
    if (directMatchId) {
      const place = placesMap.get(directMatchId);
      if (place) return place;
    }

    // Fallback to similarity search if direct match fails
    const candidateNames = Array.from(placeNamesMap.keys());
    if (candidateNames.length === 0) return undefined;

    const similarMatchResult = findMostSimilarString(name, candidateNames); // Uses normalizePlaceName internally
    if (similarMatchResult.match) {
      const matchedId = placeNamesMap.get(similarMatchResult.match); // similarMatch.match is already normalized
      if (matchedId) {
        return placesMap.get(matchedId);
      }
    }
    return undefined;
  }, [placesMap, placeNamesMap]);

  return (
    <PlaceContext.Provider value={{ 
      placesMap, 
      placeNamesMap,
      getPlaceById, 
      getPlaceByName, 
      isPlacesLoading, 
      placesError,
      loadAllPlaces
    }}>
      {children}
    </PlaceContext.Provider>
  );
};

export const usePlaces = (): PlaceContextType => {
  const context = useContext(PlaceContext);
  if (context === undefined) {
    throw new Error('usePlaces must be used within a PlaceProvider');
  }
  return context;
};
