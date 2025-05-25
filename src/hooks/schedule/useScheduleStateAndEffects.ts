
import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/core';
import { useMapContext } from '@/components/rightpanel/MapContext';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderItineraryRoute, clearAllRoutes, clearMarkersAndUiElements } = useMapContext();

  // Track loading state with ref
  const isLoadingStateRef = useRef(isLoadingState);
  // Track previous selected day with ref
  const prevSelectedDayRef = useRef<number | null>(null);
  // Track event dispatch timestamp
  const lastEventTimeRef = useRef<number>(0);
  // Track last itinerary update timestamp
  const lastItineraryUpdateRef = useRef<number>(0);

  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  // Loading state setter function
  const setIsLoadingState = useCallback((loading: boolean) => {
    setIsLoadingStateInternal(loading);
  }, []);

  // 개선된 일자 선택 핸들러
  const handleSelectDay = useCallback((day: number) => {
    console.log(`[useScheduleStateAndEffects] handleSelectDay called with day: ${day}, prevDay: ${prevSelectedDayRef.current}`);
    
    // 마커와 경로를 초기화하여 깨끗한 상태에서 시작
    if (clearAllRoutes) {
      clearAllRoutes();
    }
    
    // 이전 마커 모두 제거
    if (clearMarkersAndUiElements) {
      setTimeout(() => {
        clearMarkersAndUiElements();
      }, 0);
    }
    
    // 상태와 레퍼런스 업데이트
    prevSelectedDayRef.current = day;
    setSelectedDay(day);
    
    // 이벤트 디바운싱
    const now = Date.now();
    if (now - lastEventTimeRef.current > 200) {
      lastEventTimeRef.current = now;
      
      // 약간의 지연 후 이벤트 발생
      setTimeout(() => {
        const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
          detail: { day, timestamp: now }
        });
        
        console.log(`[useScheduleStateAndEffects] Dispatching itineraryDaySelected event: day=${day}`);
        window.dispatchEvent(daySelectedEvent);
        
        // 추가: startScheduleVisualization 이벤트 발생 (마커와 경로 동기화용)
        const visualizationEvent = new Event('startScheduleVisualization');
        console.log(`[useScheduleStateAndEffects] Dispatching startScheduleVisualization event for day ${day}`);
        window.dispatchEvent(visualizationEvent);
      }, 50);
    }
  }, [clearAllRoutes, clearMarkersAndUiElements]);

  // 일정 데이터가 새로 생성되면 첫 번째 날 자동 선택
  useEffect(() => {
    const now = Date.now();
    if (itinerary && itinerary.length > 0 && now - lastItineraryUpdateRef.current > 500) {
      console.log("[useScheduleStateAndEffects] New itinerary detected, auto-selecting first day");
      lastItineraryUpdateRef.current = now;
      
      // 마커와 경로 초기화
      if (clearAllRoutes) {
        clearAllRoutes();
      }
      
      if (clearMarkersAndUiElements) {
        clearMarkersAndUiElements();
      }
      
      // 첫째 날 자동 선택
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        const firstDay = itinerary[0].day;
        setSelectedDay(firstDay);
        
        // 약간의 지연 후 이벤트 발생
        setTimeout(() => {
          const daySelectedEvent = new CustomEvent('itineraryDaySelected', { 
            detail: { day: firstDay, timestamp: now, initialSelection: true }
          });
          
          console.log(`[useScheduleStateAndEffects] Auto-selecting first day(${firstDay}) and dispatching event`);
          window.dispatchEvent(daySelectedEvent);
          
          // 추가: 마커와 경로 동기화를 위한 시각화 시작 이벤트
          const visualizationEvent = new Event('startScheduleVisualization');
          window.dispatchEvent(visualizationEvent);
        }, 100);
      }
    }
  }, [itinerary, clearAllRoutes, clearMarkersAndUiElements]);

  // 일차 변경 시 경로 렌더링
  useEffect(() => {
    if (selectedDay === null || !itinerary || itinerary.length === 0 || !renderItineraryRoute) {
      if (selectedDay === null && clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] No day selected, clearing all routes");
        clearAllRoutes();
      }
      return;
    }

    console.log(`[useScheduleStateAndEffects] selectedDay changed to ${selectedDay}, rendering route`);
    
    // 현재 일자 데이터 찾기
    const currentDayData = itinerary.find(d => d.day === selectedDay);
    if (!currentDayData) {
      console.warn(`[useScheduleStateAndEffects] No data found for day ${selectedDay}`);
      return;
    }

    // 기존 경로 초기화
    if (clearAllRoutes) {
      clearAllRoutes();
    }
    
    // 경로 데이터가 있으면 경로 렌더링
    setTimeout(() => {
      if (renderItineraryRoute && currentDayData) {
        console.log(`[useScheduleStateAndEffects] Rendering route for day ${selectedDay} after short delay`);
        renderItineraryRoute(currentDayData);
      }
    }, 150);
  }, [selectedDay, itinerary, renderItineraryRoute, clearAllRoutes]);

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
