import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay } from '@/types/core';

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
    // 서버 응답 구조에 맞게 수정 (itinerary가 아닌 schedule 사용)
    if (!serverResponse || !serverResponse.schedule) {
      console.error("[parseServerResponse] 서버 응답에 schedule 데이터가 없습니다");
      return [];
    }
    
    // 일정 데이터 파싱
    return serverResponse.schedule.map((day, index) => ({
      day: index + 1,
      date: new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000),
      places: day.places || [],
      routeData: day.routeData || { nodeIds: [], linkIds: [] },
      interleaved_route: day.interleaved_route || []
    }));
  } catch (error) {
    console.error("[parseServerResponse] 서버 응답 파싱 중 오류:", error);
    return [];
  }
};
