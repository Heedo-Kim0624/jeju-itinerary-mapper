import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/parser-utils/timeUtils';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { eventEmitter } from '@/utils/eventEmitter';

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
  const { initializeFromServerResponse: initializeRouteMemory } = useRouteMemoryStore();
  
  // 서버 응답 이벤트 핸들러
  const handleRawServerResponse = useCallback(async (event: Event) => {
    const customEvent = event as CustomEvent<{response: NewServerScheduleResponse}>;
    const serverResponse = customEvent.detail?.response;
    
    console.log('[useServerResponseHandler] rawServerResponseReceived event received:', serverResponse);
    
    if (serverResponse) {
      try {
        await fetchAllCategoryData();
        console.log('[useServerResponseHandler] Emitting clearAllMapElements event.');
        eventEmitter.emit('clearAllMapElements'); 
        console.log('[useServerResponseHandler] Initializing RouteMemoryStore.');
        initializeRouteMemory(serverResponse);
        onServerResponse(serverResponse);
      } catch (error) {
        console.error("[useServerResponseHandler] Error processing server response:", error);
      }
    } else {
      console.error("[useServerResponseHandler] Server response event did not contain valid response data.");
    }
  }, [onServerResponse, fetchAllCategoryData, initializeRouteMemory]);

  // 이벤트 리스너 등록 및 해제
  useEffect(() => {
    if (enabled && !listenerRegistered.current) {
      console.log('[useServerResponseHandler] Registering server response event listener');
      window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
      listenerRegistered.current = true;
      
      return () => {
        console.log('[useServerResponseHandler] Unregistering server response event listener');
        window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
        listenerRegistered.current = false;
      };
    } else if (!enabled && listenerRegistered.current) {
      console.log('[useServerResponseHandler] Unregistering server response event listener (enabled=false)');
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
      listenerRegistered.current = false;
    }
  }, [enabled, handleRawServerResponse]);

  // 서버 응답을 파싱하고 데이터를 Supabase로 보강하는 함수
  const processServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date
  ): ItineraryDay[] => {
    console.log("[processServerResponse] Starting server response processing.");
    
    try {
      // The store is initialized in handleRawServerResponse.
      // This function now focuses on parsing for other parts of the app if needed.
      const parsedItinerary = originalParseServerResponse(serverResponse, startDate);
      console.log("[processServerResponse] Base parsing complete:", parsedItinerary.length, "days created.");
      
      const enrichedItinerary = enrichItineraryData(parsedItinerary);
      console.log("[processServerResponse] Supabase data enrichment complete.");
      
      return enrichedItinerary;
    } catch (error) {
      console.error("[processServerResponse] Error during response processing:", error);
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
export const parseServerResponse = originalParseServerResponse;
