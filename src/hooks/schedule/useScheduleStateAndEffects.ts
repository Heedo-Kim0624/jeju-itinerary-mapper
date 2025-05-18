
import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/schedule'; // Changed to use schedule.ts ItineraryDay
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItineraryInternal] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDayInternal] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();
  const isLoadingStateRef = useRef(isLoadingState);

  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  const setItinerary = useCallback((newItineraryParam: ItineraryDay[] | ((prevState: ItineraryDay[]) => ItineraryDay[])) => {
    // This log is helpful before calling the actual setter
    // console.log("[useScheduleStateAndEffects] setItinerary called with (param):", newItineraryParam); 
    setItineraryInternal(prevItinerary => {
      const newItinerary = typeof newItineraryParam === 'function' ? newItineraryParam(prevItinerary) : newItineraryParam;
      // console.log("[useScheduleStateAndEffects] Itinerary changing from:", prevItinerary, "to:", newItinerary);
      return newItinerary;
    });
  }, [setItineraryInternal]);

  const setSelectedDay = useCallback((dayParam: number | null | ((prevState: number | null) => number | null)) => {
    setSelectedDayInternal(dayParam);
  }, [setSelectedDayInternal]);

  const setIsLoadingState = useCallback((loading: boolean) => {
    // console.log(`[useScheduleStateAndEffects] setIsLoadingState called with: ${loading}. Current isLoadingState (ref): ${isLoadingStateRef.current}`);
    setIsLoadingStateInternal(loading);
  }, [setIsLoadingStateInternal]);

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDayInternal(day);
    console.log(`[useScheduleStateAndEffects] 일정 ${day}일차가 선택되었습니다.`);
  }, [setSelectedDayInternal]);

  useEffect(() => {
    // console.log(`[useScheduleStateAndEffects] Effect for map rendering. SelectedDay: ${selectedDay}, Itinerary length: ${itinerary.length}`);
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearAllRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route && currentDayData.interleaved_route.length > 0) {
        clearAllRoutes();
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        // console.log(`[useScheduleStateAndEffects] Rendering route for day ${selectedDay}: ${nodes.length} nodes, ${links.length} links`);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
      } else if (currentDayData) {
        // console.log(`[useScheduleStateAndEffects] Day ${selectedDay} has no valid interleaved_route. Clearing map routes.`);
        clearAllRoutes();
      } else {
        // console.log(`[useScheduleStateAndEffects] No data for selected day ${selectedDay}. Clearing routes.`);
        clearAllRoutes(); 
      }
    } else if ((selectedDay === null || itinerary.length === 0) && clearAllRoutes) {
        // console.log("[useScheduleStateAndEffects] No selected day or itinerary empty. Clearing all routes.");
        clearAllRoutes();
    }
  }, [selectedDay, itinerary, renderGeoJsonRoute, clearAllRoutes]);
  
  useEffect(() => {
    // console.log(`[useScheduleStateAndEffects] Initial state: isLoadingState=${isLoadingState}, itinerary.length=${itinerary.length}`);
  }, []);

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
