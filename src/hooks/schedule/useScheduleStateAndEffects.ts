
import { useState, useCallback, useEffect } from 'react';
import { ItineraryDay } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true); // 초기 로딩 상태 true

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();

  const setIsLoadingState = useCallback((loading: boolean) => {
    console.log(`[useScheduleStateAndEffects] setIsLoadingState called with: ${loading}. Current isLoadingState: ${isLoadingStateRef.current}`);
    isLoadingStateRef.current = loading; // Keep ref in sync for logging
    setIsLoadingStateInternal(loading);
  }, []);
  
  // Ref to hold the current value of isLoadingState for logging within setIsLoadingState
  // This avoids complexities with stale closures if setIsLoadingState were to be passed to deep dependencies
  const isLoadingStateRef = useRef(isLoadingState);
  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);


  // 일정 데이터가 변경되면 로딩 상태를 false로 설정 (주로 초기 일정 로드 후)
  useEffect(() => {
    if (itinerary.length > 0) {
      console.log(`[useScheduleStateAndEffects] Itinerary updated (length: ${itinerary.length}). Setting isLoadingState to false.`);
      setIsLoadingState(false);
    }
    // 만약 itinerary가 비워지는 경우 (예: 일정 초기화) 로딩 상태를 다시 true로 할지는 여기서 결정하지 않음.
    // 생성 프로세스가 시작될 때 true로 설정하는 것이 일반적임.
  }, [itinerary, setIsLoadingState]);

  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
    console.log(`[useScheduleStateAndEffects] 일정 ${day}일차가 선택되었습니다.`);
  }, []);

  useEffect(() => {
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearAllRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route) {
        clearAllRoutes();
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        console.log(`[useScheduleStateAndEffects] Rendering route for day ${selectedDay}: ${nodes.length} nodes, ${links.length} links`);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
      } else if (currentDayData) {
        console.log(`[useScheduleStateAndEffects] Day ${selectedDay} has no interleaved_route. Map rendering for this day might be skipped or use fallback.`);
        // clearAllRoutes(); // Optionally clear if no specific route but day exists
      } else {
        console.log(`[useScheduleStateAndEffects] No data for selected day ${selectedDay}. Clearing routes.`);
        clearAllRoutes(); 
      }
    } else {
      // selectedDay is null or itinerary is empty
      if (!renderGeoJsonRoute || !clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] Map context functions (renderGeoJsonRoute, clearAllRoutes) not available yet.");
      } else {
        console.log("[useScheduleStateAndEffects] No selected day or itinerary empty. Clearing all routes.");
        clearAllRoutes();
      }
    }
  }, [selectedDay, itinerary, renderGeoJsonRoute, clearAllRoutes]);

  return {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay,
    isLoadingState,
    setIsLoadingState, // Make sure this is the wrapped one if you need logging inside it
    handleSelectDay,
  };
};
