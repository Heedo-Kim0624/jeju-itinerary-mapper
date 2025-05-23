
import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/core';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { SegmentRoute } from '@/types/schedule';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderGeoJsonRoute, clearAllRoutes, mapContainer } = useMapContext();

  // 로딩 상태 추적을 위한 ref
  const isLoadingStateRef = useRef(isLoadingState);
  // 이전 선택 일차 추적을 위한 ref
  const prevSelectedDayRef = useRef<number | null>(null);
  // 이벤트 디스패치 타임스탬프 추적
  const lastEventTimeRef = useRef<number>(0);

  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  // 로딩 상태 설정 함수
  const setIsLoadingState = useCallback((loading: boolean) => {
    setIsLoadingStateInternal(loading);
  }, []);

  // 일정 선택 핸들러 - 개선된 버전
  const handleSelectDay = useCallback((day: number) => {
    // 동일한 일차를 다시 선택한 경우 불필요한 처리 방지
    if (day === prevSelectedDayRef.current) {
      return;
    }
    
    // 선택된 일차 업데이트
    prevSelectedDayRef.current = day;
    setSelectedDay(day);
    
    // 중복 이벤트 발생 방지 (최소 500ms 간격)
    const now = Date.now();
    if (now - lastEventTimeRef.current > 500) {
      lastEventTimeRef.current = now;
      
      // 맵 업데이트를 위한 이벤트 발생
      const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
        detail: { day }
      });
      window.dispatchEvent(daySelectedEvent);
    }
  }, []);

  // 선택된 일정 날짜에 따라 지도에 경로 렌더링
  useEffect(() => {
    // 선택된 날짜가 없거나 일정이 없으면 아무 작업도 하지 않음
    if (selectedDay === null || itinerary.length === 0 || !renderGeoJsonRoute || !clearAllRoutes) {
      if (selectedDay === null && clearAllRoutes) {
        clearAllRoutes();
      }
      return;
    }

    // 현재 선택된 날짜의 일정 데이터 찾기
    const currentDayData = itinerary.find(d => d.day === selectedDay);
    
    // 모든 경로 지우기
    clearAllRoutes();
    
    if (currentDayData?.interleaved_route) {
      try {
        // 경로 데이터 추출
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        
        // 경로 렌더링에 필요한 형식으로 데이터 변환
        const routeSegment: SegmentRoute = { 
          nodeIds: nodes, 
          linkIds: links,
          fromIndex: 0,
          toIndex: nodes.length > 0 ? nodes.length - 1 : 0
        };
        
        // 경로 렌더링
        renderGeoJsonRoute(routeSegment);
      } catch (error) {
        console.error(`[useScheduleStateAndEffects] 경로 렌더링 중 오류:`, error);
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
