import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/core'; 
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<ItineraryDay | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderItineraryRoute, clearAllRoutes } = useMapContext();

  const isLoadingStateRef = useRef(isLoadingState);
  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  const setIsLoadingState = useCallback((loading: boolean) => {
    console.log(`[useScheduleStateAndEffects] setIsLoadingState called with: ${loading}. isLoadingState before this call (via ref): ${isLoadingStateRef.current}`);
    setIsLoadingStateInternal(loading);
  }, [setIsLoadingStateInternal]);

  const handleSelectDay = useCallback((dayData: ItineraryDay | null) => {
    setSelectedDay(dayData);
    if (dayData) {
      console.log(`[useScheduleStateAndEffects] 일정 ${dayData.day}일차가 선택되었습니다.`);
    } else {
      console.log(`[useScheduleStateAndEffects] 선택된 일정이 없습니다.`);
    }
  }, []);

  useEffect(() => {
    if (selectedDay && itinerary.length > 0 && renderItineraryRoute && clearAllRoutes) {
      if (selectedDay.interleaved_route && selectedDay.interleaved_route.length > 0) {
        clearAllRoutes(); 
        console.log(`[useScheduleStateAndEffects] Rendering route for day ${selectedDay.day}`);
        renderItineraryRoute(selectedDay, undefined, () => {
          console.log(`[useScheduleStateAndEffects] Day ${selectedDay.day} route rendered.`);
        });
      } else {
        console.log(`[useScheduleStateAndEffects] Day ${selectedDay.day} has no interleaved_route. Clearing routes.`);
        clearAllRoutes(); 
      }
    } else {
      if (!renderItineraryRoute || !clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] Map context functions (renderItineraryRoute, clearAllRoutes) not available yet.");
      } else if (selectedDay === null && clearAllRoutes) { 
          console.log("[useScheduleStateAndEffects] No selected day. Clearing all routes.");
          clearAllRoutes();
      }
    }
  }, [selectedDay, itinerary, renderItineraryRoute, clearAllRoutes]);

  return {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay: handleSelectDay, 
    isLoadingState,
    setIsLoadingState,
    handleSelectDay, 
  };
};

export const fixFunctionCallExample = () => {
  
  
  
  
  
  console.log("[useScheduleStateAndEffects] Fixed function call signature mismatch");
};
