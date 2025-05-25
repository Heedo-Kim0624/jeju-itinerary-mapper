
import { useCallback, useState, useEffect, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  isGeoJsonLoaded: boolean;
  renderItineraryRoute: (
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay> | null;
  checkGeoJsonMapping: (places: Place[]) => void;
  places: Place[]; // General places
  itinerary: ItineraryDay[] | null; // Full itinerary
  selectedDay: number | null;
}

export const useMapDataEffects = ({
  isMapInitialized,
  isGeoJsonLoaded,
  renderItineraryRoute,
  serverRoutesData,
  checkGeoJsonMapping,
  places,
  itinerary,
  selectedDay,
}: UseMapDataEffectsProps) => {
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevServerRoutesDataRef = useRef<Record<number, ServerRouteDataForDay> | null>(null);
  const [isRouteVisualized, setIsRouteVisualized] = useState(false);
  
  // Reduce number of renders by throttling how often we update this state
  const routeRenderingInProgressRef = useRef(false);

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    // This function is for individual place clicks
  }, []);

  // Main effect for route visualization
  useEffect(() => {
    if (!isMapInitialized || !renderItineraryRoute) {
      return;
    }

    // Only respond to real changes in the data
    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = prevSelectedDayRef.current !== selectedDay;
    const serverRoutesChanged = prevServerRoutesDataRef.current !== serverRoutesData;
    
    if (dayChanged || itineraryChanged || serverRoutesChanged) {
      // Prevent multiple simultaneous route rendering operations
      if (routeRenderingInProgressRef.current) {
        console.log('[MapDataEffects] Route rendering already in progress, skipping this update');
        return;
      }

      routeRenderingInProgressRef.current = true;

      // Update refs immediately to prevent oscillation
      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevServerRoutesDataRef.current = serverRoutesData;

      let effectiveItineraryDay: ItineraryDay | null = null;

      // Find the day to visualize
      if (selectedDay !== null && itinerary && itinerary.length > 0) {
        effectiveItineraryDay = itinerary.find(d => d.day === selectedDay) || null;
      }
      
      // Render the route with proper cleanup of previous route
      if (effectiveItineraryDay) {
        console.log(`[MapDataEffects] Rendering route for day ${selectedDay}`);
        renderItineraryRoute(effectiveItineraryDay, serverRoutesData || undefined, () => {
          setIsRouteVisualized(true);
          routeRenderingInProgressRef.current = false;
        });
      } else if (selectedDay === null) {
        console.log(`[MapDataEffects] No day selected, clearing routes`);
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          setIsRouteVisualized(false);
          routeRenderingInProgressRef.current = false;
        });
      } else {
        console.log(`[MapDataEffects] No valid itinerary data for day ${selectedDay}, clearing routes`);
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          setIsRouteVisualized(false);
          routeRenderingInProgressRef.current = false;
        });
      }
    }
  }, [
    isMapInitialized,
    renderItineraryRoute,
    itinerary,
    selectedDay,
    serverRoutesData,
  ]);

  // Map geoJSON data to places only when needed 
  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && places.length > 0 && checkGeoJsonMapping) {
      checkGeoJsonMapping(places);
    }
  }, [isMapInitialized, isGeoJsonLoaded, places, checkGeoJsonMapping]);

  return {
    isRouteVisualized,
    handlePlaceClick,
  };
};
