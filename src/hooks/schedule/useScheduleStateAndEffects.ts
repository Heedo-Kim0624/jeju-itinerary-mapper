
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
  // 이벤트 디스패치 타이머
  const mapUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  // 로딩 상태 설정 함수 (디버깅 로그 포함)
  const setIsLoadingState = useCallback((loading: boolean) => {
    console.log(`[useScheduleStateAndEffects] setIsLoadingState called with: ${loading}. Current state: ${isLoadingStateRef.current}`);
    setIsLoadingStateInternal(loading);
  }, []);

  // 일정 선택 핸들러 - 개선된 버전
  const handleSelectDay = useCallback((day: number) => {
    console.log(`[useScheduleStateAndEffects] 일정 ${day}일차가 선택되었습니다. (이전: ${prevSelectedDayRef.current})`);
    
    // 이전에 설정된 타이머 취소
    if (mapUpdateTimerRef.current) {
      clearTimeout(mapUpdateTimerRef.current);
    }
    
    // 선택된 일차 업데이트
    prevSelectedDayRef.current = day;
    setSelectedDay(day);
    
    // 맵 업데이트를 위한 이벤트 발생 (약간의 지연을 두어 상태 업데이트 완료 보장)
    mapUpdateTimerRef.current = setTimeout(() => {
      const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
        detail: { day }
      });
      window.dispatchEvent(daySelectedEvent);
      console.log(`[useScheduleStateAndEffects] itineraryDaySelected 이벤트 발생: ${day}일차`);
    }, 100);
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
    
    console.log(`[useScheduleStateAndEffects] 선택된 ${selectedDay}일차 경로를 렌더링합니다:`, 
      currentDayData ? `${currentDayData.places.length} 장소가 있습니다.` : '해당 일차 데이터가 없습니다.');
    
    // 모든 경로 지우기 (항상 경로를 지우고 다시 그림)
    clearAllRoutes();
    
    if (currentDayData?.interleaved_route) {
      try {
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
      } catch (error) {
        console.error(`[useScheduleStateAndEffects] 경로 렌더링 중 오류:`, error);
      }
    } else if (currentDayData) {
      console.log(`[useScheduleStateAndEffects] ${selectedDay}일차는 경로 데이터가 없습니다.`);
    } else {
      console.log(`[useScheduleStateAndEffects] ${selectedDay}일차 데이터를 찾을 수 없습니다.`);
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
