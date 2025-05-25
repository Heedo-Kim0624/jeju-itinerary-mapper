import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay, ServerScheduleItem, ItineraryPlaceWithTime, RouteData, ServerRouteSummaryItem } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/parser-utils/timeUtils';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { dayStringToIndex } from '@/utils/date/dayMapping';

interface ServerResponseHandlerProps {
  onServerResponse: (response: NewServerScheduleResponse, startDate: Date) => ItineraryDay[];
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
  const { initializeFromServerResponse: initializeRouteMemory } = useRouteMemoryStore();

  // 서버 응답 이벤트 핸들러
  const handleRawServerResponse = useCallback(async (event: Event) => {
    const customEvent = event as CustomEvent<{response: NewServerScheduleResponse, startDate: Date}>;
    const serverResponse = customEvent.detail?.response;
    const startDate = customEvent.detail?.startDate || new Date(); 
    
    console.log('[useServerResponseHandler] rawServerResponseReceived 이벤트 받음:', serverResponse);
    
    if (serverResponse) {
      try {
        // Ensure Supabase data is loaded before processing
        await fetchAllCategoryData();
        initializeRouteMemory(serverResponse, startDate);
        onServerResponse(serverResponse, startDate);
      } catch (error) {
        console.error("[useServerResponseHandler] 서버 응답 처리 중 오류:", error);
      }
    } else {
      console.error("[useServerResponseHandler] 서버 응답 이벤트에 올바른 응답이 포함되어 있지 않습니다");
    }
  }, [onServerResponse, fetchAllCategoryData, initializeRouteMemory]);

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
    
    const scheduleByDayKey = serverResponse.schedule.reduce((acc, item) => {
      const dayKey = item.time_block.split('_')[0]; // e.g., 'Tue'
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(item);
      return acc;
    }, {} as Record<string, ServerScheduleItem[]>);
    
    const routeSummaryByDayKey = serverResponse.route_summary.reduce((acc, item) => {
      acc[item.day] = item; // item.day is "Mon", "Tue" etc.
      return acc;
    }, {} as Record<string, ServerRouteSummaryItem>);
    
    // Use the order from route_summary to build days
    return serverResponse.route_summary.map((summaryItem, index) => {
      const dayKey = summaryItem.day; // "Mon", "Tue", etc.
      const dayNumber = index + 1; // Chronological day number (1-based)

      const dayScheduleItems = scheduleByDayKey[dayKey] || [];
      
      const currentDayDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      const dateStr = getDateStringMMDD(currentDayDate);
      
      const placesForDay: ItineraryPlaceWithTime[] = dayScheduleItems.map((scheduleItem: ServerScheduleItem) => ({
        id: scheduleItem.id?.toString() || `fallback_${scheduleItem.place_name.replace(/\s+/g, '')}_${dayNumber}_${index}`,
        name: scheduleItem.place_name,
        category: scheduleItem.place_type,
        timeBlock: scheduleItem.time_block,
        x: 0, y: 0, address: '', road_address: '', phone: '', description: '', rating: 0, 
        image_url: '', homepage: '',
        isFallback: true, // Will be updated by enricher
        numericDbId: typeof scheduleItem.id === 'number' ? scheduleItem.id : null,
        // other fields like arriveTime, departTime are populated by enricher
      }));

      // Extract nodeIds and linkIds from interleaved_route for this day from the store's source
      const interleavedRoute = summaryItem.interleaved_route || [];
      const nodeIds = interleavedRoute.filter((_, idx) => idx % 2 === 0).map(String);
      const linkIds = interleavedRoute.filter((_, idx) => idx % 2 === 1).map(String);
      
      const routeData: RouteData = { nodeIds, linkIds, segmentRoutes: [] };

      return {
        day: dayNumber,
        date: dateStr,
        dayOfWeek: dayKey, // "Mon", "Tue", etc.
        places: placesForDay,
        totalDistance: summaryItem.total_distance_m ? summaryItem.total_distance_m / 1000 : 0,
        routeData: routeData,
        interleaved_route: interleavedRoute.map(String),
      };
    });
  } catch (error) {
    console.error("[parseServerResponse] 서버 응답 파싱 중 오류:", error);
    return [];
  }
};
