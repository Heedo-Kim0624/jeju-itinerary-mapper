
import { useState, useEffect } from 'react';
import { loadNaverMaps } from "@/utils/loadNaverMaps";
import { initializeNaverMap } from '@/utils/map/mapInitializer';

export const useMapInitialization = (mapContainer: React.RefObject<HTMLDivElement>) => {
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    const initNaverMaps = async () => {
      try {
        await loadNaverMaps();
        setIsNaverLoaded(true);
      } catch (error) {
        setIsMapError(true);
      }
    };
    
    initNaverMaps();
  }, []);

  useEffect(() => {
    if (isNaverLoaded && mapContainer.current) {
      const newMap = initializeNaverMap(mapContainer.current);
      if (newMap) {
        setMap(newMap);
        setIsMapInitialized(true);
      }
    }
  }, [isNaverLoaded, mapContainer]);

  useEffect(() => {
    if (isMapError && loadAttempts < 3) {
      const timer = setTimeout(() => {
        setIsMapError(false);
        setLoadAttempts(prev => prev + 1);
        loadNaverMaps()
          .then(() => setIsNaverLoaded(true))
          .catch(() => setIsMapError(true));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isMapError, loadAttempts]);

  return {
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
  };
};
