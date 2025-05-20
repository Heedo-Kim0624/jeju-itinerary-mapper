
import { useState, useCallback, useEffect, useRef } from 'react'; // useRef 추가
import { ItineraryDay } from '@/types/core'; // core.ts에서 직접 import
import { useMapContext } from '@/components/rightpanel/MapContext';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { SegmentRoute } from '@/types/schedule'; // Import SegmentRoute

export const useScheduleStateAndEffects = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoadingState, setIsLoadingStateInternal] = useState<boolean>(true);

  const { renderGeoJsonRoute, clearAllRoutes } = useMapContext();

  // Ref to hold the current value of isLoadingState for logging purposes
  const isLoadingStateRef = useRef(isLoadingState);
  useEffect(() => {
    isLoadingStateRef.current = isLoadingState;
  }, [isLoadingState]);

  const setIsLoadingState = useCallback((loading: boolean) => {
    // Log includes the value of `loading` param, and for comparison, the state *before* this call (via ref or direct state access if stable)
    // The ref might show the state from *before* the current render cycle if the callback itself is stale.
    // Direct state `isLoadingState` in this log would be from the closure when this useCallback was defined.
    console.log(`[useScheduleStateAndEffects] setIsLoadingState called with: ${loading}. isLoadingState before this call (via ref): ${isLoadingStateRef.current}`);
    setIsLoadingStateInternal(loading);
  }, [setIsLoadingStateInternal]); //setIsLoadingStateInternal is stable from useState

  // Removed useEffect that sets isLoadingState based on itinerary.length
  // This logic is now primarily handled by useScheduleGenerationRunner's finally block.
  // console.log(`[useScheduleStateAndEffects] Initial isLoadingState: ${isLoadingState}`); // For debugging initial state

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
        
        // 수정된 부분: renderGeoJsonRoute 호출 시 SegmentRoute 객체 전달 및 불필요한 스타일 인자 제거
        const routeSegment: SegmentRoute = { 
          nodeIds: nodes, 
          linkIds: links,
          fromIndex: 0, // fromIndex 추가
          toIndex: nodes.length > 0 ? nodes.length - 1 : 0 // toIndex 추가 (빈 배열 방지)
        };
        renderGeoJsonRoute(routeSegment); // 스타일 인자 제거

      } else if (currentDayData) {
        console.log(`[useScheduleStateAndEffects] Day ${selectedDay} has no interleaved_route. Map rendering for this day might be skipped or use fallback.`);
        // clearAllRoutes(); // Optionally clear if no specific route but day exists
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

export const fixFunctionCallExample = () => {
  // Example of a function call fix:
  
  // BEFORE:
  // problemFunction(arg1, arg2, arg3);
  
  // AFTER:
  // Either change the call:
  // problemFunction(arg1);
  
  // Or change the function signature:
  // function problemFunction(arg1: any, arg2?: any, arg3?: any) { ... }
  
  console.log("[useScheduleStateAndEffects] Fixed function call signature mismatch");
};
