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

  const handlePlaceClick = useCallback((place: Place, index: number) => {
    console.log(`[MapDataEffects] 장소 클릭됨: ${place.name} (인덱스: ${index})`);
    // This function seems more related to individual place clicks, not route rendering.
  }, []);

  useEffect(() => {
    if (!isMapInitialized || !renderItineraryRoute) {
      console.log('[MapDataEffects] Map not initialized or renderItineraryRoute missing, skipping route rendering.');
      return;
    }

    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = prevSelectedDayRef.current !== selectedDay;
    // serverRoutesData can change independently if polylines are cached,
    // so we still need to consider it.
    const serverRoutesChanged = prevServerRoutesDataRef.current !== serverRoutesData;

    if (dayChanged || itineraryChanged || serverRoutesChanged) {
      console.log(`[MapDataEffects] Route rendering trigger detected:`, {
        dayChanged,
        itineraryChanged,
        serverRoutesChanged,
        prevDay: prevSelectedDayRef.current,
        currentDay: selectedDay,
        hasItinerary: !!itinerary,
        itineraryLength: itinerary?.length || 0,
        hasServerRoutesData: !!serverRoutesData,
      });

      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevServerRoutesDataRef.current = serverRoutesData;

      let effectiveItineraryDay: ItineraryDay | null = null;

      if (selectedDay !== null && itinerary && itinerary.length > 0) {
        effectiveItineraryDay = itinerary.find(d => d.day === selectedDay) || null;
        if (!effectiveItineraryDay) {
          console.warn(`[MapDataEffects] Itinerary data for selected day ${selectedDay} not found in main 'itinerary' prop. Route will not be rendered for this day.`);
        }
      }
      
      if (effectiveItineraryDay) {
        // If serverRoutesData exists for this day and has polylinePaths,
        // renderItineraryRoute might use them. But the primary source of places/nodes/links should be effectiveItineraryDay.
        // The ItineraryDay object from `serverRoutesData[selectedDay]?.itineraryDayData` should ideally be identical
        // to `effectiveItineraryDay` if data is synced correctly. We prioritize `effectiveItineraryDay` from the main itinerary prop.
        console.log(`[MapDataEffects] Rendering route for day ${selectedDay} using data from 'itinerary' prop. Places: ${effectiveItineraryDay.places?.length}. Passing serverRoutesData for potential cached polylines.`);
        renderItineraryRoute(effectiveItineraryDay, serverRoutesData || undefined, () => {
          setIsRouteVisualized(true);
          console.log(`[MapDataEffects] Day ${selectedDay} route visualization (using main itinerary) completed.`);
        });
      } else if (selectedDay === null) {
        console.log(`[MapDataEffects] No day selected (selectedDay is null), clearing routes.`);
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          setIsRouteVisualized(false);
          console.log(`[MapDataEffects] Routes cleared due to no selected day.`);
        });
      } else {
        // This case means selectedDay is not null, but no effectiveItineraryDay was found.
        // This could happen if itinerary is null/empty or selected day is out of bounds.
        // Or if itinerary is still loading. We should clear routes.
        console.log(`[MapDataEffects] No valid itinerary data for selected day ${selectedDay}. Clearing routes.`);
        renderItineraryRoute(null, serverRoutesData || undefined, () => {
          setIsRouteVisualized(false);
          console.log(`[MapDataEffects] Routes cleared due to missing itinerary data for day ${selectedDay}.`);
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

  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && places.length > 0 && checkGeoJsonMapping) {
      console.log("[MapDataEffects] Checking GeoJSON mapping for general places list.");
      checkGeoJsonMapping(places);
    }
  }, [isMapInitialized, isGeoJsonLoaded, places, checkGeoJsonMapping]);

  return {
    isRouteVisualized,
    handlePlaceClick,
  };
};
