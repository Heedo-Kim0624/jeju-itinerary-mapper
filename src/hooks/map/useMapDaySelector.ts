
import { useCallback } from 'react';
import { useRouteMemoryStore } from './useRouteMemoryStore';
// Assuming useItinerary might be used for other itinerary related state,
// but day selection for map is now through useRouteMemoryStore.
// If useItinerary also needs to be synced, an event or effect could do that.

export const useMapDaySelector = () => {
  // selectedDay and setSelectedDay now come from the central store
  const selectedDay = useRouteMemoryStore(state => state.selectedDay);
  const setSelectedDayInStore = useRouteMemoryStore(state => state.setSelectedDay);
  
  const handleDaySelect = useCallback((day: number) => {
    console.log(`[useMapDaySelector] Day selected: ${day}`);
    setSelectedDayInStore(day);
    // Any other logic needed on day selection can go here,
    // for example, emitting an event if other parts of the app need to react.
  }, [setSelectedDayInStore]);
  
  return {
    selectedDay,
    handleDaySelect // This function now directly calls the store's setter
  };
};
