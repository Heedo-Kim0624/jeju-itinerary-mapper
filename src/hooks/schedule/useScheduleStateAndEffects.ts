import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/schedule'; // Changed to use schedule.ts ItineraryDay
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItineraryInternal] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDayInternal] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true); // 기본값 true 유지

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();
  const isLoadingStateRef = useRef(isLoadingState);

  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  const setItinerary = useCallback((newItineraryParam: ItineraryDay[] | ((prevState: ItineraryDay[]) => ItineraryDay[])) => {
    setItineraryInternal(prevItinerary => {
      const newItinerary = typeof newItineraryParam === 'function' ? newItineraryParam(prevItinerary) : newItineraryParam;
      return newItinerary;
    });
  }, [setItineraryInternal]);

  const setSelectedDay = useCallback((dayParam: number | null | ((prevState: number | null) => number | null)) => {
    setSelectedDayInternal(dayParam);
  }, [setSelectedDayInternal]);

  const setIsLoadingState = useCallback((loading: boolean) => {
    setIsLoadingStateInternal(loading);
  }, [setIsLoadingStateInternal]);

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDayInternal(day);
    console.log(`[useScheduleStateAndEffects] 일정 ${day}일차가 선택되었습니다.`);
  }, [setSelectedDayInternal]);

  useEffect(() => {
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearAllRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route && currentDayData.interleaved_route.length > 0) {
        clearAllRoutes();
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
      } else if (currentDayData) {
        clearAllRoutes();
      } else {
        clearAllRoutes(); 
      }
    } else if ((selectedDay === null || itinerary.length === 0) && clearAllRoutes) {
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
