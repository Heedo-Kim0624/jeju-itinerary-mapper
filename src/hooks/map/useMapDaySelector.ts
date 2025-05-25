
import { useCallback, useEffect } from 'react';
import { useItinerary } from '@/hooks/use-itinerary'; 
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { useEventEmitter, GlobalEventEmitter } from '@/hooks/events/useEventEmitter';

export const useMapDaySelector = () => {
  const { selectedDay: itinerarySelectedDay, setSelectedDay: setItinerarySelectedDay } = useItinerary();
  const { selectedMapDay, setSelectedMapDay, getCurrentDayRouteData, getDayRouteData } = useRouteMemoryStore();
  const { emit, subscribe } = useEventEmitter();

  const handleDaySelect = useCallback((day: number) => {
    if (itinerarySelectedDay === day && selectedMapDay === day) {
      return;
    }
    
    console.log(`[useMapDaySelector] Day ${day} selected via UI or event.`);
    
    if (setItinerarySelectedDay) {
       setItinerarySelectedDay(day);
    } else {
        console.warn("[useMapDaySelector] setItinerarySelectedDay is not available from useItinerary.");
    }
    
    setSelectedMapDay(day);
    
    const dayDataForEvent = getDayRouteData(day); 
    emit('mapDayChanged', { 
      day,
      routeData: {
        linkIdsCount: dayDataForEvent?.linkIds?.length || 0,
        nodeIdsCount: dayDataForEvent?.nodeIds?.length || 0,
        polylinesCount: dayDataForEvent?.polylines?.length || 0,
        markersCount: dayDataForEvent?.markers?.length || 0,
      }
    });
    
    console.log(`[useMapDaySelector] Day ${day} data for map:`, dayDataForEvent);

  }, [itinerarySelectedDay, selectedMapDay, setItinerarySelectedDay, setSelectedMapDay, emit, getDayRouteData]);

  useEffect(() => {
    if (itinerarySelectedDay !== null && itinerarySelectedDay !== selectedMapDay) {
      console.log(`[useMapDaySelector] Syncing selectedMapDay (${selectedMapDay}) with itinerarySelectedDay (${itinerarySelectedDay})`);
      setSelectedMapDay(itinerarySelectedDay);
      
      const dayDataForEvent = getDayRouteData(itinerarySelectedDay);
      emit('mapDayChanged', { 
        day: itinerarySelectedDay,
        routeData: {
          linkIdsCount: dayDataForEvent?.linkIds?.length || 0,
          nodeIdsCount: dayDataForEvent?.nodeIds?.length || 0,
          polylinesCount: dayDataForEvent?.polylines?.length || 0,
          markersCount: dayDataForEvent?.markers?.length || 0,
        }
      });
    }
  }, [itinerarySelectedDay, selectedMapDay, setSelectedMapDay, emit, getDayRouteData]);

  useEffect(() => {
    const handleExternalDaySelectedEvent = (data: { day: number } | number) => {
      const dayToSelect = typeof data === 'number' ? data : data?.day;
      if (dayToSelect !== undefined && typeof dayToSelect === 'number') {
        console.log(`[useMapDaySelector] Received 'daySelected' event for day: ${dayToSelect}. Calling handleDaySelect.`);
        handleDaySelect(dayToSelect);
      }
    };
    
    const unsubscribe = subscribe<{ day: number } | number>('daySelected', handleExternalDaySelectedEvent);
    
    return () => {
      unsubscribe();
    };
  }, [subscribe, handleDaySelect]);
  
  return {
    selectedDayForMap: selectedMapDay, 
    handleDaySelect, 
  };
};
