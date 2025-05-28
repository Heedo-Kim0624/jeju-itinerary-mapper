
import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay, ServerScheduleItem, ItineraryPlaceWithTime } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/parser-utils/timeUtils';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';

interface ServerResponseHandlerProps {
  onServerResponse: (response: NewServerScheduleResponse) => void;
  enabled: boolean;
}

export const useServerResponseHandler = ({
  onServerResponse,
  enabled = true
}: ServerResponseHandlerProps) => {
  const listenerRegistered = useRef(false);
  const { fetchAllCategoryData } = useSupabaseDataFetcher();
  const { enrichItineraryData } = useItineraryEnricher();
  
  const handleRawServerResponse = useCallback(async (event: Event) => {
    const customEvent = event as CustomEvent<{response: NewServerScheduleResponse}>;
    const serverResponse = customEvent.detail?.response;
    
    console.log('[useServerResponseHandler] rawServerResponseReceived 이벤트 받음:', serverResponse);
    
    if (serverResponse) {
      try {
        await fetchAllCategoryData();
        onServerResponse(serverResponse);
      } catch (error) {
        console.error("[useServerResponseHandler] 서버 응답 처리 중 오류:", error);
      }
    } else {
      console.error("[useServerResponseHandler] 서버 응답 이벤트에 올바른 응답이 포함되어 있지 않습니다");
    }
  }, [onServerResponse, fetchAllCategoryData]);

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

  const processServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date
  ): ItineraryDay[] => {
    console.log("[processServerResponse] 서버 응답 처리 시작");
    
    try {
      // 경로 데이터 없이 시간표 데이터만 파싱
      const parsedItinerary = parseServerResponseSimple(serverResponse, startDate);
      console.log("[processServerResponse] 기본 파싱 완료:", parsedItinerary.length, "일차 생성됨");
      
      // Supabase 데이터로 보강
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

// 간소화된 서버 응답 파싱 함수 (경로 데이터 제외)
export const parseServerResponseSimple = (
  serverResponse: NewServerScheduleResponse,
  startDate: Date
): ItineraryDay[] => {
  console.log("[parseServerResponseSimple] 서버 응답 파싱 시작:", serverResponse);
  
  try {
    if (!serverResponse || !serverResponse.schedule || !serverResponse.route_summary) {
      console.error("[parseServerResponseSimple] 서버 응답에 schedule 또는 route_summary 데이터가 없습니다");
      return [];
    }
    
    if (serverResponse.route_summary.length === 0) {
      console.warn("[parseServerResponseSimple] route_summary is empty, returning empty itinerary.");
      return [];
    }
    
    // 요일별로 일정 그룹화
    const scheduleByDay = serverResponse.schedule.reduce((acc, item) => {
      const dayKey = item.time_block.split('_')[0]; 
      if (!acc[dayKey]) {
        acc[dayKey] = [];
      }
      acc[dayKey].push(item);
      return acc;
    }, {} as Record<string, ServerScheduleItem[]>);
    
    // 경로 요약에서 거리 정보만 추출 (노드/링크 데이터 제외)
    const dayRouteMappings = serverResponse.route_summary.reduce((acc, routeSummaryItem) => {
      const dayKey = routeSummaryItem.day;
      acc[dayKey] = {
        totalDistance: routeSummaryItem.total_distance_m / 1000, // m -> km
      };
      return acc;
    }, {} as Record<string, { totalDistance: number }>);

    const daysOfWeekFromSummary = serverResponse.route_summary.map(item => item.day);
    
    return daysOfWeekFromSummary.map((dayOfWeekKey, index) => {
      const dayNumber = index + 1;
      const dayScheduleItems = scheduleByDay[dayOfWeekKey] || [];
      const routeInfo = dayRouteMappings[dayOfWeekKey] || { totalDistance: 0 };
      
      const currentDayDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      const dateStr = getDateStringMMDD(currentDayDate);

      const placesForDay: ItineraryPlaceWithTime[] = dayScheduleItems.map((scheduleItem: ServerScheduleItem) => {
        const placeId = scheduleItem.id?.toString() || scheduleItem.place_name;
        return {
          id: placeId,
          name: scheduleItem.place_name,
          category: scheduleItem.place_type,
          timeBlock: scheduleItem.time_block,
          x: 0, y: 0, address: '', road_address: '', phone: '', description: '', 
          rating: 0, image_url: '', homepage: '',
          geoNodeId: placeId, 
          isFallback: true,
          isSelected: false,
          isCandidate: false,
          numericDbId: typeof scheduleItem.id === 'number' ? scheduleItem.id : null,
        };
      });
      
      // 경로 데이터 없이 기본 RouteData 구조만 유지
      const emptyRouteData = {
        nodeIds: [],
        linkIds: [],
        day: dayNumber,
        routeId: `simple_route_${dayNumber}_${Date.now()}`
      };
      
      return {
        day: dayNumber,
        date: dateStr,
        dayOfWeek: dayOfWeekKey,
        places: placesForDay,
        totalDistance: routeInfo.totalDistance,
        routeData: emptyRouteData, // 빈 경로 데이터
        interleaved_route: [], // 빈 배열
        routeId: emptyRouteData.routeId,
      };
    });
  } catch (error) {
    console.error("[parseServerResponseSimple] 서버 응답 파싱 중 오류:", error);
    return [];
  }
};
