
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
    
    // 요일별로 schedule 항목 그룹화
    const scheduleByDay = serverResponse.schedule.reduce((acc, item) => {
      const dayKey = item.time_block.split('_')[0]; // 'Tue_0900' -> 'Tue'
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(item);
      return acc;
    }, {} as Record<string, ServerScheduleItem[]>);
    
    // route_summary를 요일별로 매핑
    const routeSummaryByDay = serverResponse.route_summary.reduce((acc, item) => {
      acc[item.day] = item; // item.day is like "Tue", "Wed"
      return acc;
    }, {} as Record<string, ServerRouteSummaryItem>);
    
    // 요일 목록 (route_summary의 day 필드 기준, 순서 유지)
    const daysOfWeekFromSummary = serverResponse.route_summary.map(item => item.day);
    
    // 각 요일에 대한 ItineraryDay 객체 생성
    return daysOfWeekFromSummary.map((dayOfWeekKey, index) => {
      const dayScheduleItems = scheduleByDay[dayOfWeekKey] || [];
      const dayRouteSummary = routeSummaryByDay[dayOfWeekKey];
      
      const currentDayDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      const dateStr = getDateStringMMDD(currentDayDate); // MM/DD 형식
      // getDayOfWeekString(currentDayDate)를 사용할 수도 있으나, route_summary의 dayKey를 사용
      
      const placesForDay: ItineraryPlaceWithTime[] = dayScheduleItems.map((scheduleItem: ServerScheduleItem) => {
        const placeId = scheduleItem.id?.toString() || scheduleItem.place_name; // Fallback to place_name if id is missing
        return {
          id: placeId,
          name: scheduleItem.place_name,
          category: scheduleItem.place_type, // Ensure this aligns with CategoryName if strict typing needed
          timeBlock: scheduleItem.time_block,
          // Default values, to be populated later with actual data
          x: 0, 
          y: 0, 
          address: '', 
          road_address: '', 
          phone: '', 
          description: '', 
          rating: 0, 
          image_url: '', 
          homepage: '', 
          // Optional fields
          arriveTime: undefined,
          departTime: undefined,
          stayDuration: undefined,
          travelTimeToNext: undefined,
          geoNodeId: placeId,
          isFallback: true,
          isSelected: false,
          isCandidate: false,
          numericDbId: typeof scheduleItem.id === 'number' ? scheduleItem.id : null,
        };
      });

      const currentInterleavedRoute = dayRouteSummary?.interleaved_route || [];
      const nodeIds = currentInterleavedRoute
        .filter((_id, idx) => idx % 2 === 0)
        .map(id => String(id));
      const linkIds = currentInterleavedRoute
        .filter((_id, idx) => idx % 2 === 1)
        .map(id => String(id));
      
      // For consistency with other parsers, map all to string.
      // The type ItineraryDay.interleaved_route allows (string | number)[]
      // but other parts like formatServerItinerary.ts use string[].
      const finalInterleavedRoute = currentInterleavedRoute.map(id => String(id));

      const routeData: RouteData = {
        nodeIds,
        linkIds,
        segmentRoutes: [], // Initialize segmentRoutes
      };

      return {
        day: index + 1,
        date: dateStr,
        dayOfWeek: dayOfWeekKey, // Use the day string from route_summary (e.g., "Tue")
        places: placesForDay,
        totalDistance: dayRouteSummary?.total_distance_m ? dayRouteSummary.total_distance_m / 1000 : 0, // km
        routeData: routeData,
        interleaved_route: finalInterleavedRoute,
      };
    });
  } catch (error) {
    console.error("[parseServerResponse] 서버 응답 파싱 중 오류:", error);
    return [];
  }
};
