import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/core';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { SegmentRoute } from '@/types/schedule';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderItineraryRoute, renderGeoJsonRoute, clearAllRoutes, mapContainer } = useMapContext();

  // Track loading state with ref
  const isLoadingStateRef = useRef(isLoadingState);
  // Track previous selected day with ref
  const prevSelectedDayRef = useRef<number | null>(null);
  // Track event dispatch timestamp
  const lastEventTimeRef = useRef<number>(0);
  // Track last itinerary update timestamp
  const lastItineraryUpdateRef = useRef<number>(0);

  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  // Loading state setter function
  const setIsLoadingState = useCallback((loading: boolean) => {
    setIsLoadingStateInternal(loading);
  }, []);

  // Improved day selection handler with diagnostics
  const handleSelectDay = useCallback((day: number) => {
    console.log(`[useScheduleStateAndEffects] handleSelectDay called with day: ${day}, prevDay: ${prevSelectedDayRef.current}`);
    
    // Update state and ref
    prevSelectedDayRef.current = day;
    setSelectedDay(day);
    
    // Create and dispatch event with minimal delay to ensure state updates first
    const now = Date.now();
    if (now - lastEventTimeRef.current > 200) { // Debounce/throttle event dispatch
      lastEventTimeRef.current = now;
      
      // Fire event after a minimal delay to ensure state is updated first
      setTimeout(() => {
        const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
          detail: { day, timestamp: now } // Include timestamp for diagnostics
        });
        
        console.log(`[useScheduleStateAndEffects] Dispatching itineraryDaySelected event: day=${day}`);
        window.dispatchEvent(daySelectedEvent);
      }, 0); // Minimal delay
    }
  }, []);

  // Handle new itinerary data - auto-select first day and dispatch event
  useEffect(() => {
    const now = Date.now();
    // Only process when itinerary changes significantly (not just minor updates)
    if (itinerary && itinerary.length > 0 && now - lastItineraryUpdateRef.current > 500) {
      console.log("[useScheduleStateAndEffects] New itinerary detected, auto-selecting first day");
      lastItineraryUpdateRef.current = now;
      
      // Select first day automatically
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        const firstDay = itinerary[0].day;
        setSelectedDay(firstDay);
        
        // Dispatch day selection event with a short delay
        setTimeout(() => {
          const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
            detail: { day: firstDay, timestamp: now } // Ensure timestamp is included
          });
          
          console.log(`[useScheduleStateAndEffects] Auto-selecting first day(${firstDay}) and dispatching event`);
          window.dispatchEvent(daySelectedEvent);
        }, 50); // Short delay for state update propagation
      }
    }
  }, [itinerary]); // Removed handleSelectDay from dependencies as it's stable via useCallback

  // Additional effect specifically for rendering routes when day changes
  useEffect(() => {
    if (selectedDay === null || !itinerary || itinerary.length === 0 || !renderItineraryRoute) {
      if (selectedDay === null && clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] No day selected, clearing all routes");
        clearAllRoutes();
      }
      return;
    }

    console.log(`[useScheduleStateAndEffects] selectedDay changed to ${selectedDay}, rendering route`);
    
    // Find current day data
    const currentDayData = itinerary.find(d => d.day === selectedDay);
    if (!currentDayData) {
      console.warn(`[useScheduleStateAndEffects] No data found for day ${selectedDay}`);
      return;
    }

    // Clear previous routes first
    if (clearAllRoutes) {
      clearAllRoutes();
    }
    
    // Render route if data available
    // Check specifically for routeData as it might be missing or incomplete
    if (currentDayData.routeData && currentDayData.routeData.linkIds && currentDayData.routeData.linkIds.length > 0) {
      console.log(`[useScheduleStateAndEffects] Rendering itinerary route for day ${selectedDay} using renderItineraryRoute`);
      renderItineraryRoute(currentDayData); // Changed to renderItineraryRoute
    } else {
      console.log(`[useScheduleStateAndEffects] No detailed route data (linkIds) for day ${selectedDay}. Consider fallback or ensure data integrity.`);
      // Optionally, if you still want to render something (e.g., direct lines between places if no routeData):
      // renderItineraryRoute(currentDayData); // This will handle cases where routeData might be minimal or just places
    }
  }, [selectedDay, itinerary, renderItineraryRoute, clearAllRoutes]); // Updated dependency

  return {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  };
};
