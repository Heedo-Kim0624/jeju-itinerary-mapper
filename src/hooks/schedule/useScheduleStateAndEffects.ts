
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
  // 마지막으로 처리한 일정 업데이트 타임스탬프
  const lastItineraryUpdateRef = useRef<number>(0);

  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  // 로딩 상태 설정 함수
  const setIsLoadingState = useCallback((loading: boolean) => {
    setIsLoadingStateInternal(loading);
  }, []);

  // 일정 선택 핸들러 - 개선된 버전
  const handleSelectDay = useCallback((day: number) => {
    console.log(`[useScheduleStateAndEffects] handleSelectDay called with day: ${day}, prevDay: ${prevSelectedDayRef.current}`);
    
    // 동일한 일차를 다시 선택한 경우에도 이벤트를 발생
    // 이는 마커 갱신 문제를 해결하는 데 도움이 됨
    prevSelectedDayRef.current = day;
    setSelectedDay(day);
    
    // 이벤트 발생 (최소 200ms 간격)
    const now = Date.now();
    if (now - lastEventTimeRef.current > 200) {
      lastEventTimeRef.current = now;
      
      // 명확한 일정 일자 선택 이벤트 발생 - 마커 업데이트를 트리거
      const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
        detail: { day, timestamp: now }
      });
      
      console.log(`[useScheduleStateAndEffects] itineraryDaySelected 이벤트 발생: day=${day}`);
      window.dispatchEvent(daySelectedEvent);
    }
  }, []);

  // 일정이 새로 설정될 때 자동으로 첫 번째 일자 선택
  useEffect(() => {
    const now = Date.now();
    // 일정 데이터가 새로 들어오거나 변경된 경우에만 처리 (1초 이상 간격)
    if (itinerary && itinerary.length > 0 && now - lastItineraryUpdateRef.current > 1000) {
      console.log("[useScheduleStateAndEffects] 새 일정 데이터 감지, 첫 번째 일자 자동 선택");
      lastItineraryUpdateRef.current = now;
      
      // 첫 번째 일자를 자동으로 선택
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        const firstDay = itinerary[0].day;
        setSelectedDay(firstDay);
        
        // 일정 일자 선택 이벤트도 발생시켜 마커가 즉시 생성되도록 함
        const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
          detail: { day: firstDay, timestamp: now }
        });
        
        console.log(`[useScheduleStateAndEffects] 첫 번째 일자(${firstDay}) 자동 선택 및 이벤트 발생`);
        window.dispatchEvent(daySelectedEvent);
      }
    }
  }, [itinerary]);

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
        console.log(`[useScheduleStateAndEffects] 일자 ${selectedDay}의 경로 렌더링 시작`);
        
        // 경로 데이터 추출
        const nodes = extractAllNodesFromRoute(currentDayData.interleaved_route).map(String);
        const links = extractAllLinksFromRoute(currentDayData.interleaved_route).map(String);
        
        console.log(`[useScheduleStateAndEffects] 경로 데이터 추출 완료: ${nodes.length} nodes, ${links.length} links`);
        
        // 경로 렌더링에 필요한 형식으로 데이터 변환
        const routeSegment: SegmentRoute = { 
          nodeIds: nodes, 
          linkIds: links,
          fromIndex: 0,
          toIndex: nodes.length > 0 ? nodes.length - 1 : 0
        };
        
        // 경로 렌더링
        renderGeoJsonRoute(routeSegment);
        
        console.log(`[useScheduleStateAndEffects] 일자 ${selectedDay}의 경로 렌더링 완료`);
      } catch (error) {
        console.error(`[useScheduleStateAndEffects] 경로 렌더링 중 오류:`, error);
      }
    } else {
      console.log(`[useScheduleStateAndEffects] 일자 ${selectedDay}의 경로 데이터가 없거나 불완전함`);
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
