
import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();

  // 로딩 상태 변경 함수 (로깅 포함)
  const setIsLoadingState = useCallback((loading: boolean) => {
    console.log(`[useScheduleStateAndEffects] 로딩 상태 변경: ${loading}`);
    setIsLoadingStateInternal(loading);
  }, []);

  // 로딩 상태 변경 감지 및 로깅
  useEffect(() => {
    console.log(`[useScheduleStateAndEffects] 로딩 상태 변경 감지: ${isLoadingState}`);
  }, [isLoadingState]);
  
  // 일정 데이터 변경 감지 및 로깅
  useEffect(() => {
    console.log(`[useScheduleStateAndEffects] 일정 데이터 변경 감지: ${itinerary.length}일 일정`);
    
    // 일정이 있으나 로딩 상태가 여전히 true인 경우, 자동으로 로딩 상태 해제
    if (itinerary.length > 0 && isLoadingState) {
      console.log('[useScheduleStateAndEffects] 일정 데이터 수신 완료, 로딩 상태 자동 해제');
      setIsLoadingState(false);
    }
  }, [itinerary, isLoadingState, setIsLoadingState]);

  // 일자 선택 핸들러
  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
    console.log(`[useScheduleStateAndEffects] 일정 ${day}일차가 선택되었습니다.`);
  }, []);

  // 선택된 일자에 해당하는 경로 렌더링
  useEffect(() => {
    if (selectedDay !== null && itinerary.length > 0 && renderGeoJsonRoute && clearAllRoutes) {
      const currentDayData = itinerary.find(d => d.day === selectedDay);
      if (currentDayData?.interleaved_route) {
        clearAllRoutes();
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        console.log(`[useScheduleStateAndEffects] ${selectedDay}일차 경로 렌더링: ${nodes.length}개 노드, ${links.length}개 링크`);
        renderGeoJsonRoute(nodes, links, { strokeColor: '#3366FF', strokeWeight: 5, strokeOpacity: 0.8 });
      } else if (currentDayData) {
        console.log(`[useScheduleStateAndEffects] ${selectedDay}일차에 interleaved_route가 없습니다.`);
      } else {
        console.log(`[useScheduleStateAndEffects] 선택된 일자 ${selectedDay}에 해당하는 데이터가 없습니다.`);
        clearAllRoutes(); 
      }
    } else {
      if (!renderGeoJsonRoute || !clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] 지도 컨텍스트 함수가 아직 준비되지 않았습니다.");
      } else if (selectedDay === null || (selectedDay !== null && itinerary.length === 0)) {
        console.log("[useScheduleStateAndEffects] 선택된 일자가 없거나 일정이 비어 있어 모든 경로를 제거합니다.");
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
    setIsLoadingState,
    handleSelectDay,
  };
};
