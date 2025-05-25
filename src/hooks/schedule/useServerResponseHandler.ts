import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ItineraryDay, NewServerScheduleResponse } from '@/types/core';

// onServerResponse 프로퍼티 타입을 수정하여 startDate를 받고 ItineraryDay[]를 반환하는 함수로 지정
interface ServerResponseHandlerProps {
  onServerResponse: (response: NewServerScheduleResponse, startDate: Date) => Promise<ItineraryDay[]>;
  enabled?: boolean;
}

export const useServerResponseHandler = ({
  onServerResponse,
  enabled = true
}: ServerResponseHandlerProps) => {
  const [isListenerRegistered, setIsListenerRegistered] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleServerResponse = async (event: CustomEvent) => {
      try {
        const serverResponse = event.detail;

        if (!serverResponse) {
          console.error('[useServerResponseHandler] Server response is null or undefined');
          toast.error('서버 응답을 받지 못했습니다.');
          return;
        }

        console.log('[useServerResponseHandler] Server response received:', JSON.stringify(serverResponse).substring(0, 100) + '...');
        
        // 현재 날짜를 기본 시작일로 사용
        const startDate = new Date(); 
        
        // onServerResponse 호출 시 startDate 매개변수 추가
        await onServerResponse(serverResponse, startDate);
        
      } catch (error) {
        console.error('[useServerResponseHandler] Error handling server response:', error);
        toast.error('서버 응답 처리 중 오류가 발생했습니다.');
      }
    };

    console.log('[useServerResponseHandler] Registering event listener for rawServerResponseReceived');
    
    // Event handler for raw server response
    window.addEventListener('rawServerResponseReceived', handleServerResponse as EventListener);
    setIsListenerRegistered(true);

    return () => {
      console.log('[useServerResponseHandler] Removing event listener for rawServerResponseReceived');
      window.removeEventListener('rawServerResponseReceived', handleServerResponse as EventListener);
      setIsListenerRegistered(false);
    };
  }, [onServerResponse, enabled]);

  return {
    isListenerRegistered
  };
};

// 서버 응답을 파싱하여 ItineraryDay 배열로 변환하는 함수
// 이 함수는 일정을 파싱하는 핵심 로직을 포함함
export function parseServerResponse(serverResponse: NewServerScheduleResponse, startDate: Date): ItineraryDay[] {
  if (!serverResponse || !serverResponse.schedule || !Array.isArray(serverResponse.schedule)) {
    console.error('[parseServerResponse] Invalid server response structure:', serverResponse);
    return [];
  }

  try {
    // 여기서 서버 응답을 파싱하여 ItineraryDay 배열로 변환하는 로직을 구현
    // 예제 코드는 서버 응답 형식에 따라 달라질 수 있음
    const itineraryDays: ItineraryDay[] = [];
    
    // 이 부분은 실제 서버 응답 구조에 맞게 구현해야 함
    // 현재는 예시로 빈 배열을 반환하도록 함
    
    return itineraryDays;
  } catch (error) {
    console.error('[parseServerResponse] Error parsing server response:', error);
    return [];
  }
}
