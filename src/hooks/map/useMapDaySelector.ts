
import { useCallback } from 'react';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { EventEmitter } from '@/hooks/events/useEventEmitter'; // Using static emitter for simplicity here
import { useScheduleStateAndEffects } from '@/hooks/schedule/useScheduleStateAndEffects';


export const useMapDaySelector = () => {
  // Assuming useScheduleStateAndEffects is the source of truth for selectedDay for UI
  const { selectedDay, setSelectedDay: setUiSelectedDay } = useScheduleStateAndEffects();
  const { 
    setSelectedDay: setRouteStoreSelectedDay, 
    getCurrentDayRouteData 
  } = useRouteMemoryStore();

  const handleDaySelect = useCallback((day: number) => {
    if (selectedDay === day) return;

    console.log(`[useMapDaySelector] Day ${day} selected.`);
    
    // Update UI state
    setUiSelectedDay(day);
    
    // Update route memory store's selected day
    setRouteStoreSelectedDay(day);
    
    // Emit event for map components to react
    EventEmitter.emit('mapDayChanged', { day });
    
    const currentDayData = getCurrentDayRouteData(); // This will now fetch for the newly set 'day'
    console.log(`[useMapDaySelector] Day ${day} route data from store:`, {
      linkIds: currentDayData?.linkIds?.length || 0,
      nodeIds: currentDayData?.nodeIds?.length || 0,
      polylines: currentDayData?.polylines?.length || 0,
      markers: currentDayData?.markers?.length || 0,
    });
  }, [selectedDay, setUiSelectedDay, setRouteStoreSelectedDay, getCurrentDayRouteData]);

  return {
    selectedDayFromUI: selectedDay, // This is the day selected in the UI (e.g., ItineraryPanel)
    handleDaySelect,
  };
};
