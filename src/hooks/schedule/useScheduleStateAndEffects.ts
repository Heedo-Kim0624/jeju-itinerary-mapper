
import { useState, useCallback, useEffect, useRef } from 'react';
import { ItineraryDay } from '@/types/core';
import { useMapContext } from '@/components/rightpanel/MapContext';

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(false); // Default to false

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
    console.log(`[useScheduleStateAndEffects] handleSelectDay called with day: ${day}, prevDayRef: ${prevSelectedDayRef.current}, currentSelectedState: ${selectedDay}`);

    // 즉시 상태 업데이트
    setSelectedDay(day);
    prevSelectedDayRef.current = day; // Ref도 동기화

    if (clearAllRoutes) {
      console.log(`[useScheduleStateAndEffects] Clearing all routes for day select: ${day}`);
      clearAllRoutes();
    }
    // 일반 검색 마커(초록색)와 일정 마커(숫자) 모두 여기서 지워져야, MapMarkers에서 선택된 날짜에 맞는 마커만 다시 그림
    if (clearMarkersAndUiElements) {
      console.log(`[useScheduleStateAndEffects] Clearing all markers and UI for day select: ${day}`);
      clearMarkersAndUiElements(); 
    }
    
    const now = Date.now();
    if (now - lastEventTimeRef.current > 30) { // Debounce time, adjust if needed
      lastEventTimeRef.current = now;
      
      const daySelectedEvent = new CustomEvent('itineraryDaySelected', {
        detail: { day, timestamp: now }
      });
      console.log(`[useScheduleStateAndEffects] Dispatching itineraryDaySelected event: day=${day}`);
      window.dispatchEvent(daySelectedEvent);

      // This event might trigger route rendering logic in useMapDataEffects implicitly via selectedDay prop change
      // Explicit visualization event might be redundant if MapDataEffects handles it comprehensively
      // const visualizationEvent = new CustomEvent('startScheduleVisualization', {
      //   detail: { day, timestamp: now }
      // });
      // console.log(`[useScheduleStateAndEffects] Dispatching startScheduleVisualization event for day ${day}`);
      // window.dispatchEvent(visualizationEvent);
    } else {
      console.log(`[useScheduleStateAndEffects] Day selection event for day ${day} debounced.`);
    }
  }, [selectedDay, clearAllRoutes, clearMarkersAndUiElements]); // Removed setSelectedDay from deps, it's stable

  // 일정 데이터가 새로 생성되면 첫 번째 날 자동 선택
  useEffect(() => {
    const now = Date.now();
    if (itinerary && itinerary.length > 0 &&
        ((now - lastItineraryUpdateRef.current > 500) || (selectedDay === null && itinerary[0]))) {
        
      console.log("[useScheduleStateAndEffects] New itinerary detected or initial load, auto-selecting first day if needed.");
      lastItineraryUpdateRef.current = now;

      const firstDayToSelect = itinerary[0]?.day;
      
      if (firstDayToSelect !== undefined && (selectedDay === null || !itinerary.some(d => d.day === selectedDay))) {
        console.log(`[useScheduleStateAndEffects] Auto-selecting first day: ${firstDayToSelect}`);
        
        if (clearAllRoutes) clearAllRoutes();
        if (clearMarkersAndUiElements) clearMarkersAndUiElements();
        
        setSelectedDay(firstDayToSelect); 
        prevSelectedDayRef.current = firstDayToSelect; 

        const daySelectedEvent = new CustomEvent('itineraryDaySelected', {
          detail: { day: firstDayToSelect, timestamp: now, initialSelection: true }
        });
        window.dispatchEvent(daySelectedEvent);
        // const visualizationEvent = new CustomEvent('startScheduleVisualization', {
        //   detail: { day: firstDayToSelect, timestamp: now, initialSelection: true }
        // });
        // window.dispatchEvent(visualizationEvent);
        console.log(`[useScheduleStateAndEffects] Dispatched events for initial auto-selected day ${firstDayToSelect}`);
      } else if (selectedDay !== null && itinerary.some(d => d.day === selectedDay)) {
        console.log(`[useScheduleStateAndEffects] Valid day ${selectedDay} already selected. Re-render will be handled by effects.`);
        // Ensure markers and routes are consistent for the already selected day if itinerary changes but day does not
        // This might require re-triggering render logic if itinerary content for selectedDay changed.
        // clearMarkersAndUiElements and clearAllRoutes might be needed here too if itinerary for *current* day changed.
        // For now, let MapDataEffects and MapMarkers handle this via prop changes.
      }
    }
  }, [itinerary, selectedDay, clearAllRoutes, clearMarkersAndUiElements]); // Removed setSelectedDay from deps

  // 일차 변경 시 경로 렌더링 (useMapDataEffects.ts에서 주로 처리)
  useEffect(() => {
    // The actual rendering renderItineraryRoute(currentDayData) is now handled by useMapDataEffects
    // based on changes to selectedDay and itinerary props.
    // This effect can be simplified or removed if all logic is covered by useMapDataEffects.
    if (selectedDay === null && clearAllRoutes) {
      // console.log("[useScheduleStateAndEffects] selectedDay is null, ensuring routes are cleared (delegated to MapDataEffects).");
      // clearAllRoutes(); // Potentially redundant, let useMapDataEffects handle this.
    }
    // console.log(`[useScheduleStateAndEffects] selectedDay changed to ${selectedDay}. Route rendering delegated to useMapDataEffects.`);
  }, [selectedDay, itinerary, renderItineraryRoute, clearAllRoutes]);

  return {
    itinerary,
    setItinerary,
    selectedDay,
    setSelectedDay, // setSelectedDay 함수 반환 추가
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  };
};
