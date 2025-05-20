
import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/core';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { SegmentRoute } from '@/types/schedule';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();

  // 로딩 상태 추적을 위한 ref
  const isLoadingStateRef = useRef(isLoadingState);
  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  // 로딩 상태 설정 함수 (디버깅 로그 포함)
  const setIsLoadingState = useCallback((loading: boolean) => {
    console.log(`[useScheduleStateAndEffects] setIsLoadingState called with: ${loading}. Current state: ${isLoadingStateRef.current}`);
    setIsLoadingStateInternal(loading);
  }, []);

  // 일정 선택 핸들러
  const handleSelectDay = useCallback((day: number) => {
    setSelectedDay(day);
    console.log(`[useScheduleStateAndEffects] 일정 ${day}일차가 선택되었습니다.`);
  }, []);

  // 선택된 일정 날짜에 따라 지도에 경로 렌더링
  useEffect(() => {
    // 선택된 날짜가 없거나 일정이 없으면 아무 작업도 하지 않음
    if (selectedDay === null || itinerary.length === 0 || !renderGeoJsonRoute || !clearAllRoutes) {
      if (selectedDay === null && clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] 선택된 날짜가 없어 모든 경로를 제거합니다.");
        clearAllRoutes();
      }
      return;
    }

    // 현재 선택된 날짜의 일정 데이터 찾기
    const currentDayData = itinerary.find(d => d.day === selectedDay);
    
    if (currentDayData?.interleaved_route) {
      // 모든 경로 지우기
      clearAllRoutes();
      
      // 경로 데이터 추출
      const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
      const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
      
      console.log(`[useScheduleStateAndEffects] 선택된 ${selectedDay}일차 경로 렌더링: ${nodes.length} 노드, ${links.length} 링크`);
      
      // 경로 렌더링에 필요한 형식으로 데이터 변환
      const routeSegment: SegmentRoute = { 
        nodeIds: nodes, 
        linkIds: links,
        fromIndex: 0,
        toIndex: nodes.length > 0 ? nodes.length - 1 : 0
      };
      
      // 경로 렌더링
      renderGeoJsonRoute(routeSegment);
    } else if (currentDayData) {
      console.log(`[useScheduleStateAndEffects] ${selectedDay}일차는 경로 데이터가 없습니다.`);
    } else {
      console.log(`[useScheduleStateAndEffects] ${selectedDay}일차 데이터를 찾을 수 없습니다.`);
      clearAllRoutes();
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
