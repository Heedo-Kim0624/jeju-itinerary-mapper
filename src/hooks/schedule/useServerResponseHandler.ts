
import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay } from '@/types/core';
// import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/parser-utils/timeUtils'; // 사용되지 않으므로 주석 처리
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { eventEmitter, GlobalEventEmitter } from '@/utils/eventEmitter'; // GlobalEventEmitter 추가

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
  const listenerRegistered = useRef(false);
  const { fetchAllCategoryData } = useSupabaseDataFetcher();
  const { enrichItineraryData } = useItineraryEnricher(); // enrichItineraryData 사용
  const { initializeFromServerResponse: initializeRouteMemory } = useRouteMemoryStore();
  
  const handleRawServerResponse = useCallback(async (event: Event) => {
    const customEvent = event as CustomEvent<{response: NewServerScheduleResponse}>;
    const serverResponse = customEvent.detail?.response;
    
    console.log('[useServerResponseHandler] rawServerResponseReceived event received:', serverResponse);
    
    if (serverResponse) {
      try {
        await fetchAllCategoryData();
        console.log('[useServerResponseHandler] Emitting clearAllMapElements event.');
        GlobalEventEmitter.emit('clearAllMapElements'); 
        console.log('[useServerResponseHandler] Initializing RouteMemoryStore.');
        initializeRouteMemory(serverResponse);
        onServerResponse(serverResponse);
      } catch (error) {
        console.error("[useServerResponseHandler] Error processing server response:", error);
      }
    } else {
      console.error("[useServerResponseHandler] Server response event did not contain valid response data.");
    }
  }, [onServerResponse, fetchAllCategoryData, initializeRouteMemory]); // enrichItineraryData 제거, GlobalEventEmitter 의존성 불필요

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

  // processServerResponse 함수는 더 이상 originalParseServerResponse를 직접 호출하지 않고,
  // enrichItineraryData를 사용하여 itineraryDays를 보강합니다.
  // ItineraryDay[]를 반환하도록 수정합니다.
  const processServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date, // startDate는 enrichItineraryData 또는 하위 로직에서 사용될 수 있습니다.
    itineraryDaysInput: ItineraryDay[] // 파싱된 ItineraryDay[]를 입력으로 받음
  ): ItineraryDay[] => {
    console.log("[processServerResponse] Starting server response processing.");
    
    try {
      // initializeRouteMemory는 handleRawServerResponse에서 호출됩니다.
      // 여기서 itineraryDaysInput (예: 외부 파서 결과)을 받아 보강합니다.
      console.log("[processServerResponse] Base parsing (assumed done externally) resulted in:", itineraryDaysInput.length, "days.");
      
      const enrichedItinerary = enrichItineraryData(itineraryDaysInput); // itineraryDaysInput 사용
      console.log("[processServerResponse] Supabase data enrichment complete.");
      
      return enrichedItinerary;
    } catch (error) {
      console.error("[processServerResponse] Error during response processing:", error);
      return []; // 오류 발생 시 빈 배열 반환
    }
  }, [enrichItineraryData]); // 의존성 배열에서 startDate 제거, 필요한 경우 다시 추가

  return {
    isListenerRegistered: listenerRegistered.current,
    processServerResponse
  };
};

// parseServerResponse는 외부에서 사용될 수 있도록 export를 유지합니다.
// (구현은 제공되지 않았으므로, 기존 파일에 해당 함수가 있다고 가정)
// export const parseServerResponse = ... (기존 parseServerResponse 함수 구현)
// 만약 parseServerResponse 함수가 없다면, 이 export는 제거해야 합니다.
// 여기서는 originalParseServerResponse가 실제 parseServerResponse를 의미한다고 가정하고,
// 이 파일 내에서는 직접 사용하지 않으므로, 해당 export는 필요에 따라 유지/제거합니다.
// 현재 파일에서는 사용되지 않으므로 주석 처리 또는 삭제 가능.
// export const parseServerResponse = originalParseServerResponse; 
