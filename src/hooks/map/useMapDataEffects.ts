
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
  
  const routeRenderingInProgressRef = useRef(false);

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    // This function is for individual place clicks
  }, []);

  // Main effect for route visualization
  useEffect(() => {
    if (!isMapInitialized || !renderItineraryRoute) {
      return;
    }

    const itineraryActuallyChanged = prevItineraryRef.current !== itinerary;
    const dayActuallyChanged = prevSelectedDayRef.current !== selectedDay;
    const serverRoutesActuallyChanged = prevServerRoutesDataRef.current !== serverRoutesData;
    
    let timeoutId: NodeJS.Timeout | undefined;

    if (dayActuallyChanged || itineraryActuallyChanged || serverRoutesActuallyChanged) {
      if (routeRenderingInProgressRef.current) {
        console.log('[MapDataEffects] Route rendering already in progress, skipping this update due to ref lock.');
        return;
      }
      routeRenderingInProgressRef.current = true;

      // Update refs immediately to prevent re-entry with stale ref values
      // These refs track the state for which processing has started.
      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevServerRoutesDataRef.current = serverRoutesData;

      // Defer the actual rendering logic to ensure it happens after potential state updates settle
      timeoutId = setTimeout(() => {
        console.log(`[MapDataEffects] Starting route processing for day: ${selectedDay}. Clearing old routes first.`);
        // Clear existing polylines by rendering null.
        // The renderItineraryRoute function should handle actual polyline clearing.
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          console.log(`[MapDataEffects] Old routes cleared for day: ${selectedDay}. Now checking for new route.`);
          let effectiveItineraryDay: ItineraryDay | null = null;

          if (selectedDay !== null && itinerary && itinerary.length > 0) {
            effectiveItineraryDay = itinerary.find(d => d.day === selectedDay) || null;
          }
          
          if (effectiveItineraryDay) {
            console.log(`[MapDataEffects] Rendering new route for day ${selectedDay}`);
            renderItineraryRoute(effectiveItineraryDay, serverRoutesData || undefined, () => {
              setIsRouteVisualized(true);
              routeRenderingInProgressRef.current = false;
              console.log(`[MapDataEffects] Route for day ${selectedDay} rendered. Dispatching event.`);
              window.dispatchEvent(new CustomEvent('routeRenderingComplete', { detail: { day: selectedDay, status: 'rendered' } }));
            });
          } else {
            console.log(`[MapDataEffects] No valid itinerary data for day ${selectedDay}, routes remain cleared. Dispatching event.`);
            setIsRouteVisualized(false); // No route is visualized
            routeRenderingInProgressRef.current = false;
            window.dispatchEvent(new CustomEvent('routeRenderingComplete', { detail: { day: selectedDay, status: 'cleared' } }));
          }
        });
      }, 0); // setTimeout 0 to defer to next tick
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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

