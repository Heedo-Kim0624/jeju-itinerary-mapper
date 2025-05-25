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

    // Clear operations should happen before new rendering is triggered by state change
    // MapContext functions are assumed to be stable
    if (clearAllRoutes) {
      console.log(`[useScheduleStateAndEffects] Clearing all routes for day select: ${day}`);
      clearAllRoutes();
    }
    if (clearMarkersAndUiElements) {
      console.log(`[useScheduleStateAndEffects] Clearing all markers for day select: ${day}`);
      clearMarkersAndUiElements(); // This should trigger marker re-render via MapMarkers useEffect on selectedDay
    }
    
    // 이벤트 디스패치는 상태 변경 후 React가 DOM 업데이트를 처리할 시간을 주기 위해 짧은 지연을 유지할 수 있으나,
    // 마커/경로 렌더링이 주로 selectedDay prop 변경에 의한 useEffect로 처리된다면, 이 이벤트의 역할이 중복될 수 있음.
    // 지금은 유지하되, MapMarkers.tsx의 이벤트 리스너와 중복 동작을 면밀히 검토해야 함.
    const now = Date.now();
    if (now - lastEventTimeRef.current > 50) { // Reduced debounce time
      lastEventTimeRef.current = now;
      
      // Dispatch events after a very short delay to allow state to propagate if needed,
      // though ideally direct prop changes should drive UI updates.
      // These events might be for other parts of the app, not just map markers/routes.
      // setTimeout(() => { // Consider removing if not strictly necessary for other listeners
        const daySelectedEvent = new CustomEvent('itineraryDaySelected', {
          detail: { day, timestamp: now }
        });
        console.log(`[useScheduleStateAndEffects] Dispatching itineraryDaySelected event: day=${day}`);
        window.dispatchEvent(daySelectedEvent);

        const visualizationEvent = new CustomEvent('startScheduleVisualization', {
          detail: { day, timestamp: now }
        });
        console.log(`[useScheduleStateAndEffects] Dispatching startScheduleVisualization event for day ${day}`);
        window.dispatchEvent(visualizationEvent);
      // }, 10); // Very short delay, or remove setTimeout
    } else {
      console.log(`[useScheduleStateAndEffects] Day selection event for day ${day} debounced.`);
    }
  }, [selectedDay, clearAllRoutes, clearMarkersAndUiElements]);

  // 일정 데이터가 새로 생성되면 첫 번째 날 자동 선택
  useEffect(() => {
    const now = Date.now();
    // 일정 데이터가 새로 생성되고, 마지막 업데이트로부터 충분한 시간이 지났을 때 (예: 500ms)
    // 또는 itinerary가 있고 selectedDay가 null인데 itinerary[0]이 존재할 때 (최초 로드 후 자동 선택)
    if (itinerary && itinerary.length > 0 &&
        ((now - lastItineraryUpdateRef.current > 500) || (selectedDay === null && itinerary[0]))) {
        
      console.log("[useScheduleStateAndEffects] New itinerary detected or initial load, auto-selecting first day if needed.");
      lastItineraryUpdateRef.current = now;

      if (clearAllRoutes) clearAllRoutes();
      if (clearMarkersAndUiElements) clearMarkersAndUiElements();

      const firstDayToSelect = itinerary[0]?.day;
      
      // selectedDay가 null이거나 현재 itinerary에 없는 경우에만 첫날 자동 선택
      if (firstDayToSelect !== undefined && (selectedDay === null || !itinerary.some(d => d.day === selectedDay))) {
        console.log(`[useScheduleStateAndEffects] Auto-selecting first day: ${firstDayToSelect}`);
        // handleSelectDay(firstDayToSelect); // This will cause double clearing/eventing. Set state directly.
        setSelectedDay(firstDayToSelect); 
        prevSelectedDayRef.current = firstDayToSelect; // Keep ref in sync

        // Dispatch events for initial selection
        // setTimeout(() => { // Consider removing setTimeout
          const daySelectedEvent = new CustomEvent('itineraryDaySelected', {
            detail: { day: firstDayToSelect, timestamp: now, initialSelection: true }
          });
          window.dispatchEvent(daySelectedEvent);
          const visualizationEvent = new CustomEvent('startScheduleVisualization', {
            detail: { day: firstDayToSelect, timestamp: now, initialSelection: true }
          });
          window.dispatchEvent(visualizationEvent);
          console.log(`[useScheduleStateAndEffects] Dispatched events for initial auto-selected day ${firstDayToSelect}`);
        // }, 50); // Short delay or remove
      } else if (selectedDay !== null && itinerary.some(d => d.day === selectedDay)) {
        // 이미 유효한 날짜가 선택되어 있으면, 해당 날짜에 대한 마커/경로를 다시 렌더링하도록 트리거할 수 있음.
        // 이는 useMapDataEffects와 MapMarkers의 useEffect가 selectedDay 변경 시 처리하므로 별도 호출 불필요.
        console.log(`[useScheduleStateAndEffects] Valid day ${selectedDay} already selected. Re-render will be handled by effects.`);
      }
    }
  }, [itinerary, selectedDay, clearAllRoutes, clearMarkersAndUiElements]);

  // 일차 변경 시 경로 렌더링 (useMapDataEffects.ts로 이전되었으므로 이 useEffect는 제거 또는 단순화 가능)
  // This useEffect block for rendering route is now primarily handled by useMapDataEffects.
  // Keeping a simplified version or removing it. For now, let's assume useMapDataEffects is the authority.
  useEffect(() => {
    if (selectedDay === null) {
      // This logic is also in useMapDataEffects, but defensive clearing here is fine.
      if (clearAllRoutes) {
        console.log("[useScheduleStateAndEffects] selectedDay is null, ensuring routes are cleared (redundant with MapDataEffects potentially).");
        // clearAllRoutes(); // This might be too aggressive if MapDataEffects handles it.
      }
      return;
    }
    // The actual rendering renderItineraryRoute(currentDayData) is now handled by useMapDataEffects
    // based on changes to selectedDay and itinerary props.
    console.log(`[useScheduleStateAndEffects] selectedDay changed to ${selectedDay}. Route rendering delegated to useMapDataEffects.`);
    
    // If renderItineraryRoute was directly called here previously:
    // const currentDayData = itinerary.find(d => d.day === selectedDay);
    // if (renderItineraryRoute && currentDayData) {
    //   if (clearAllRoutes) clearAllRoutes();
    //   renderItineraryRoute(currentDayData);
    // }
  }, [selectedDay, itinerary, renderItineraryRoute, clearAllRoutes]);

  return {
    itinerary,
    setItinerary,
    selectedDay,
    // setSelectedDay, // handleSelectDay를 통해 선택하도록 유도
    isLoadingState,
    setIsLoadingState,
    handleSelectDay,
  };
};
