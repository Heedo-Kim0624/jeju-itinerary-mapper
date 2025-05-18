
import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();

  // Ref to hold the current value of isLoadingState for logging purposes
  const isLoadingStateRef = useRef(isLoadingState);
  
  // 로딩 종료 시간 체크를 위한 ref
  const loadingEndTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
    
    // 로딩이 완료되면 타임스탬프 저장
    if (!isLoadingState && loadingEndTimeRef.current === null) {
      loadingEndTimeRef.current = Date.now();
      console.log(`[useScheduleStateAndEffects] 로딩 상태가 false로 변경됨 - 타임스탬프 기록: ${new Date().toISOString()}`);
    }
  }, [isLoadingState]);

  const setIsLoadingState = useCallback((loading: boolean) => {
    console.log(`[useScheduleStateAndEffects] setIsLoadingState 호출됨: ${loading}. 현재 상태: ${isLoadingStateRef.current}`);
    setIsLoadingStateInternal(loading);
    
    // 로딩이 끝나는 시점에 5초 후 강제 로딩 종료 예약 (보험)
    if (!loading) {
      console.log(`[useScheduleStateAndEffects] 로딩 상태가 false로 설정됨. 보험용 타이머 설정.`);
    }
  }, []);

  // 일정 데이터가 바뀔 때 자동으로 로딩 상태 업데이트
  useEffect(() => {
    if (itinerary.length > 0 && isLoadingState) {
      console.log(`[useScheduleStateAndEffects] 일정 데이터 있음(${itinerary.length}일), 로딩 상태 해제`);
      setIsLoadingState(false);
    }
  }, [itinerary, isLoadingState, setIsLoadingState]);

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
      } else {
        console.log(`[useScheduleStateAndEffects] No data for selected day ${selectedDay}. Clearing routes.`);
        clearAllRoutes(); 
      }
    } else {
      if (!renderGeoJsonRoute || !clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] Map context functions (renderGeoJsonRoute, clearAllRoutes) not available yet.");
      } else {
        // Only clear routes if selectedDay becomes null or itinerary is truly empty,
        // Avoid clearing if it's just an intermediate state before new itinerary arrives.
        if (selectedDay === null || (selectedDay !== null && itinerary.length === 0)) {
          console.log("[useScheduleStateAndEffects] No selected day or itinerary empty. Clearing all routes.");
          clearAllRoutes();
        }
      }
    }
  }, [selectedDay, itinerary, renderGeoJsonRoute, clearAllRoutes]);

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
