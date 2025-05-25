
import { useCallback, useState, useEffect, useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase'; // or @/types/core
import type { ServerRouteDataForDay } from '@/hooks/map/useServerRoutes';
import { useMapContext } from '@/components/rightpanel/MapContext'; // For handleRouteRenderingCompleteForContext

interface UseMapDataEffectsProps {
  isMapInitialized: boolean;
  isGeoJsonLoaded: boolean;
  renderItineraryRoute: ( // This comes from MapContext -> useMapCore -> useRouteManager
    itineraryDay: ItineraryDay | null,
    allServerRoutes?: Record<number, ServerRouteDataForDay>,
    onComplete?: () => void // This onComplete is for the renderItineraryRoute itself
  ) => void;
  serverRoutesData: Record<number, ServerRouteDataForDay> | null;
  checkGeoJsonMapping: (places: Place[]) => void;
  places: Place[]; 
  itinerary: ItineraryDay[] | null; 
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
  // const [isRouteVisualized, setIsRouteVisualized] = useState(false); // This state might be less relevant now
  
  const routeRenderingInProgressRef = useRef(false);
  const { handleRouteRenderingCompleteForContext } = useMapContext(); // Get context's handler

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    // This function is for individual place clicks, can be expanded later
    console.log(`[MapDataEffects] Place clicked: ${place.name}, index: ${index}`);
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

      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevServerRoutesDataRef.current = serverRoutesData;

      timeoutId = setTimeout(() => {
        console.log(`[MapDataEffects] Starting route processing for day: ${selectedDay}. Clearing old routes first.`);
        
        // The renderItineraryRoute (from useRouteManager) should handle clearing its polylines.
        // It then calls its own onComplete.
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          console.log(`[MapDataEffects] Old routes cleared for day: ${selectedDay}. Now checking for new route.`);
          let effectiveItineraryDay: ItineraryDay | null = null;

          if (selectedDay !== null && itinerary && itinerary.length > 0) {
            effectiveItineraryDay = itinerary.find(d => d.day === selectedDay) || null;
          }
          
          if (effectiveItineraryDay) {
            console.log(`[MapDataEffects] Rendering new route for day ${selectedDay}`);
            renderItineraryRoute(effectiveItineraryDay, serverRoutesData || undefined, () => {
              // This onComplete is for the *new* route rendering.
              // setIsRouteVisualized(true);
              routeRenderingInProgressRef.current = false;
              console.log(`[MapDataEffects] Route for day ${selectedDay} rendered. Notifying MapContext.`);
              if (handleRouteRenderingCompleteForContext) {
                handleRouteRenderingCompleteForContext(); // Notify MapContext
              }
              // Event dispatch 'routeRenderingComplete' is now 'routeRenderingCompleteInternal' from MapContext
            });
          } else {
            console.log(`[MapDataEffects] No valid itinerary data for day ${selectedDay}, routes remain cleared. Notifying MapContext.`);
            // setIsRouteVisualized(false);
            routeRenderingInProgressRef.current = false;
            if (handleRouteRenderingCompleteForContext) {
                handleRouteRenderingCompleteForContext(); // Notify MapContext even if no route, so markers can proceed
            }
            // Event dispatch 'routeRenderingComplete' is now 'routeRenderingCompleteInternal' from MapContext
          }
        });
      }, 0); 
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // If a route rendering was in progress and component unmounts or effect re-runs, reset the lock.
      // This might need careful handling if multiple effects can trigger route rendering.
      // For now, assume this effect is the primary driver for day changes.
      // if (routeRenderingInProgressRef.current) {
      //   routeRenderingInProgressRef.current = false;
      // }
    };
  }, [
    isMapInitialized,
    renderItineraryRoute,
    itinerary,
    selectedDay,
    serverRoutesData,
    handleRouteRenderingCompleteForContext, // Added dependency
  ]);

  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && places.length > 0 && checkGeoJsonMapping) {
      checkGeoJsonMapping(places);
    }
  }, [isMapInitialized, isGeoJsonLoaded, places, checkGeoJsonMapping]);

  return {
    // isRouteVisualized, // This state might be less critical now.
    handlePlaceClick,
  };
};
