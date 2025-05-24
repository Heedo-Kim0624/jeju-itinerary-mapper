
import { useEffect } from 'react';
import type { Place, ItineraryDay } from '@/types/core';

interface UseMarkerLifecycleManagerProps {
  selectedDay: number | null;
  itinerary: ItineraryDay[] | null;
  places: Place[];
  isMapInitialized: boolean;
  map: any; 
  forceMarkerUpdate: () => void;
  prevSelectedDayRef: React.MutableRefObject<number | null>;
  prevItineraryRef: React.MutableRefObject<ItineraryDay[] | null>;
  prevPlacesRef: React.MutableRefObject<Place[] | null>;
}

export const useMarkerLifecycleManager = ({
  selectedDay,
  itinerary,
  places,
  isMapInitialized,
  map,
  forceMarkerUpdate,
  prevSelectedDayRef,
  prevItineraryRef,
  prevPlacesRef,
}: UseMarkerLifecycleManagerProps) => {

  useEffect(() => {
    const itineraryChanged = itinerary !== prevItineraryRef.current;
    const placesChanged = places !== prevPlacesRef.current;
    const selectedDayChanged = selectedDay !== prevSelectedDayRef.current;

    const needsUpdate = selectedDayChanged || itineraryChanged || placesChanged;
    
    if (needsUpdate && isMapInitialized) {
      console.log(`[useMarkerLifecycleManager] Props changed, evaluating update. Day: ${selectedDayChanged}, Itin: ${itineraryChanged}, Places: ${placesChanged}`);
      
      prevSelectedDayRef.current = selectedDay;
      prevItineraryRef.current = itinerary;
      prevPlacesRef.current = places;
      
      // Always force update if relevant props change and map is ready.
      // The renderMarkers function will decide what to display based on current props.
      console.log(`[useMarkerLifecycleManager] Forcing marker update due to prop changes.`);
      forceMarkerUpdate();
    }
  }, [selectedDay, itinerary, places, isMapInitialized, forceMarkerUpdate, prevSelectedDayRef, prevItineraryRef, prevPlacesRef]);

  useEffect(() => {
    if (isMapInitialized && map) {
      console.log(`[useMarkerLifecycleManager] Initial mount with map initialized, forcing marker update.`);
      const timer = setTimeout(() => {
        forceMarkerUpdate();
      }, 300); // Adjusted delay for potentially faster initial render
      return () => clearTimeout(timer);
    }
  }, [isMapInitialized, map, forceMarkerUpdate]);
};
