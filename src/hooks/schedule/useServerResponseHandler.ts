
import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay, ServerScheduleItem, ItineraryPlaceWithTime, RouteData } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/parser-utils/timeUtils'; // 경로 수정 및 임포트 추가

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
  
  // 서버 응답 이벤트 핸들러
  const handleRawServerResponse = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{response: NewServerScheduleResponse}>;
    const serverResponse = customEvent.detail?.response;
    
    console.log('[useServerResponseHandler] rawServerResponseReceived 이벤트 받음:', serverResponse);
    
    if (serverResponse) {
      onServerResponse(serverResponse);
    } else {
      console.error("[useServerResponseHandler] 서버 응답 이벤트에 올바른 응답이 포함되어 있지 않습니다");
    }
  }, [onServerResponse]);

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

  return {
    isListenerRegistered: listenerRegistered.current
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
    
    return serverResponse.route_summary.map((summaryItem, index) => {
      const currentDayDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      const dayOfWeek = getDayOfWeekString(currentDayDate);
      const dateStr = getDateStringMMDD(currentDayDate);

      const dayScheduleItems = serverResponse.schedule.filter(item =>
        item.time_block.startsWith(summaryItem.day)
      );

      const placesForDay: ItineraryPlaceWithTime[] = dayScheduleItems.map((scheduleItem: ServerScheduleItem) => {
        const placeId = scheduleItem.id?.toString() || scheduleItem.place_name;
        return {
          id: placeId,
          name: scheduleItem.place_name,
          category: scheduleItem.place_type,
          timeBlock: scheduleItem.time_block,
          x: 0, // 기본값 또는 플레이스홀더 값
          y: 0, // 기본값 또는 플레이스홀더 값
          address: '', // 기본값 또는 플레이스홀더 값
          road_address: '', // 기본값 또는 플레이스홀더 값
          phone: '', // 기본값 또는 플레이스홀더 값
          description: '', // 기본값 또는 플레이스홀더 값
          rating: 0, // 기본값 또는 플레이스홀더 값
          image_url: '', // 기본값 또는 플레이스홀더 값
          homepage: '', // 기본값 또는 플레이스홀더 값
          // Optional fields
          arriveTime: undefined,
          departTime: undefined,
          stayDuration: undefined,
          travelTimeToNext: undefined,
          geoNodeId: placeId, // geoNodeId는 string | undefined 이므로, placeId 사용
          isFallback: true,
          isSelected: false,
          isCandidate: false,
          numericDbId: typeof scheduleItem.id === 'number' ? scheduleItem.id : null,
        };
      });

      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      summaryItem.interleaved_route.forEach((id, i) => {
        if (i % 2 === 0) {
          nodeIds.push(String(id));
        } else {
          linkIds.push(String(id));
        }
      });

      const routeData: RouteData = {
        nodeIds,
        linkIds,
        segmentRoutes: [], // 기본값
      };

      return {
        day: index + 1,
        date: dateStr,
        dayOfWeek: dayOfWeek,
        places: placesForDay,
        totalDistance: summaryItem.total_distance_m / 1000, // km 단위
        routeData: routeData,
        interleaved_route: summaryItem.interleaved_route.map(String),
      };
    });
  } catch (error) {
    console.error("[parseServerResponse] 서버 응답 파싱 중 오류:", error);
    return [];
  }
};

