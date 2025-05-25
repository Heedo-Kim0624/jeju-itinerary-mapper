import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay, ServerScheduleItem, ItineraryPlaceWithTime, RouteData, ServerRouteSummaryItem } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/parser-utils/timeUtils';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';

interface ServerResponseHandlerProps {
  onServerResponse: (response: NewServerScheduleResponse) => void;
  enabled: boolean;
}

/**
 * 서버 응답 이벤트를 처리하는 훅
 */
export const useServerResponseHandler = ({
  onServerResponse,
  enabled = true
}: ServerResponseHandlerProps) => {
  // 이벤트 리스너가 이미 등록되었는지 추적
  const listenerRegistered = useRef(false);
  const { fetchAllCategoryData } = useSupabaseDataFetcher();
  const { enrichItineraryData } = useItineraryEnricher();
  
  // 서버 응답 이벤트 핸들러
  const handleRawServerResponse = useCallback(async (event: Event) => {
    const customEvent = event as CustomEvent<{response: NewServerScheduleResponse}>;
    const serverResponse = customEvent.detail?.response;
    
    console.log('[useServerResponseHandler] rawServerResponseReceived 이벤트 받음:', serverResponse);
    
    if (serverResponse) {
      try {
        // Ensure Supabase data is loaded before processing
        await fetchAllCategoryData();
        onServerResponse(serverResponse);
      } catch (error) {
        console.error("[useServerResponseHandler] 서버 응답 처리 중 오류:", error);
      }
    } else {
      console.error("[useServerResponseHandler] 서버 응답 이벤트에 올바른 응답이 포함되어 있지 않습니다");
    }
  }, [onServerResponse, fetchAllCategoryData]);

  // 이벤트 리스너 등록 및 해제
  useEffect(() => {
    if (enabled && !listenerRegistered.current) {
      console.log('[useServerResponseHandler] 서버 응답 이벤트 리스너 등록');
      window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
      listenerRegistered.current = true;
      
      return () => {
        console.log('[useServerResponseHandler] 서버 응답 이벤트 리스너 해제');
        window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
        listenerRegistered.current = false;
      };
    } else if (!enabled && listenerRegistered.current) {
      console.log('[useServerResponseHandler] 이벤트 리스너 해제 (enabled=false)');
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
      listenerRegistered.current = false;
    }
  }, [enabled, handleRawServerResponse]);

  // 서버 응답을 파싱하고 데이터를 Supabase로 보강하는 함수
  const processServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date
  ): ItineraryDay[] => {
    console.log("[processServerResponse] 서버 응답 처리 시작");
    
    try {
      // 1. 기본 서버 응답 파싱하여 itineraryDays 생성
      const parsedItinerary = parseServerResponse(serverResponse, startDate);
      console.log("[processServerResponse] 기본 파싱 완료:", parsedItinerary.length, "일차 생성됨");
      
      // 2. Supabase 데이터로 보강
      const enrichedItinerary = enrichItineraryData(parsedItinerary);
      console.log("[processServerResponse] Supabase 데이터 보강 완료");
      
      return enrichedItinerary;
    } catch (error) {
      console.error("[processServerResponse] 응답 처리 중 오류:", error);
      return [];
    }
  }, [enrichItineraryData]);

  return {
    isListenerRegistered: listenerRegistered.current,
    processServerResponse
  };
};

/**
 * 서버 응답을 파싱하여 일정 데이터로 변환하는 함수
 * 외부 모듈에서 참조할 수 있도록 명시적으로 내보냄
 */
export const parseServerResponse = (
  serverResponse: NewServerScheduleResponse,
  startDate: Date
): ItineraryDay[] => {
  console.log("[parseServerResponse] 서버 응답 파싱 시작:", serverResponse);
  
  try {
    if (!serverResponse || !serverResponse.schedule || !serverResponse.route_summary) {
      console.error("[parseServerResponse] 서버 응답에 schedule 또는 route_summary 데이터가 없습니다");
      return [];
    }
    if (serverResponse.route_summary.length === 0) {
        console.warn("[parseServerResponse] route_summary is empty, returning empty itinerary.");
        return [];
    }
    
    const scheduleByDay = serverResponse.schedule.reduce((acc, item) => {
      const dayKey = item.time_block.split('_')[0]; 
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(item);
      return acc;
    }, {} as Record<string, ServerScheduleItem[]>);
    
    // 각 일자별 경로 데이터를 명확히 분리하기 위해 route_summary를 매핑
    // route_summary의 day 필드 (e.g., "Mon", "Tue")를 기준으로 매핑
    const dayRouteMappings = serverResponse.route_summary.reduce((acc, routeSummaryItem) => {
      // Assuming routeSummaryItem.day is like "Mon", "Tue", etc.
      // The actual day number (1, 2, ...) will be determined by the order in route_summary
      acc[routeSummaryItem.day] = {
        totalDistance: routeSummaryItem.total_distance_m / 1000, // m -> km
        interleaved_route: routeSummaryItem.interleaved_route || [], // Ensure it's an array
        // routeId: `route_${routeSummaryItem.day}_${Date.now()}` // 고유 ID 추가 (필요시 사용)
      };
      return acc;
    }, {} as Record<string, { totalDistance: number; interleaved_route: (string | number)[] /*; routeId: string*/ }>);

    const daysOfWeekFromSummary = serverResponse.route_summary.map(item => item.day);
    
    return daysOfWeekFromSummary.map((dayOfWeekKey, index) => {
      const dayNumber = index + 1; // 1-based day number
      const dayScheduleItems = scheduleByDay[dayOfWeekKey] || [];
      const routeInfo = dayRouteMappings[dayOfWeekKey] || { totalDistance: 0, interleaved_route: [] /*, routeId: `empty_${dayNumber}`*/ };
      
      const currentDayDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      const dateStr = getDateStringMMDD(currentDayDate);
      // const dayOfWeekStr = getDayOfWeekString(currentDayDate); // Can use this or dayOfWeekKey

      const placesForDay: ItineraryPlaceWithTime[] = dayScheduleItems.map((scheduleItem: ServerScheduleItem) => {
        const placeId = scheduleItem.id?.toString() || scheduleItem.place_name;
        return {
          id: placeId,
          name: scheduleItem.place_name,
          category: scheduleItem.place_type,
          timeBlock: scheduleItem.time_block,
          x: 0, y: 0, address: '', road_address: '', phone: '', description: '', 
          rating: 0, image_url: '', homepage: '',
          geoNodeId: placeId, // Default to placeId, might be refined later
          isFallback: true,
          isSelected: false,
          isCandidate: false,
          numericDbId: typeof scheduleItem.id === 'number' ? scheduleItem.id : null,
        };
      });
      
      // Convert interleaved_route to RouteData for this specific day
      const routeData = convertInterleavedRouteToRouteData(routeInfo.interleaved_route, dayNumber);
      
      return {
        day: dayNumber,
        date: dateStr,
        dayOfWeek: dayOfWeekKey, // Use the key from route_summary (e.g., "Tue")
        places: placesForDay,
        totalDistance: routeInfo.totalDistance,
        routeData: routeData, // Use the converted, day-specific routeData
        interleaved_route: routeInfo.interleaved_route.map(String), // Store as string array
        // routeId: routeInfo.routeId, // (필요시 사용)
      };
    });
  } catch (error) {
    console.error("[parseServerResponse] 서버 응답 파싱 중 오류:", error);
    return [];
  }
};

// Helper function to convert interleaved route to RouteData
const convertInterleavedRouteToRouteData = (
  interleavedRoute: (string | number)[],
  day: number // 일자 정보 추가
): RouteData => {
  const loggingPrefix = `[RouteDataConverter Day ${day}]`;
  console.log(`${loggingPrefix} Converting route data. Items: ${interleavedRoute.length}`);
  
  const nodeIds: string[] = [];
  const linkIds: string[] = [];
  
  interleavedRoute.forEach((item, index) => {
    if (index % 2 === 0) { // Node ID (should be string or number convertible to string)
      nodeIds.push(String(item));
    } else { // Link ID (should be string or number convertible to string)
      linkIds.push(String(item));
    }
  });
  
  console.log(`${loggingPrefix} Extracted ${nodeIds.length} nodes and ${linkIds.length} links.`);
  
  return { nodeIds, linkIds, day }; // day 정보 추가
};
