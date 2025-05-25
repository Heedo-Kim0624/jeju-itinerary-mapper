import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay } from '@/types/core';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { GlobalEventEmitter } from '@/utils/eventEmitter'; // GlobalEventEmitter import

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
  const { enrichItineraryData } = useItineraryEnricher(); 
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
  }, [onServerResponse, fetchAllCategoryData, initializeRouteMemory]); 

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

  const processServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date, 
    itineraryDaysInput: ItineraryDay[] 
  ): ItineraryDay[] => {
    console.log("[processServerResponse] Starting server response processing.");
    
    try {
      console.log("[processServerResponse] Base parsing (assumed done externally) resulted in:", itineraryDaysInput.length, "days.");
      
      const enrichedItinerary = enrichItineraryData(itineraryDaysInput); 
      console.log("[processServerResponse] Supabase data enrichment complete.");
      
      return enrichedItinerary;
    } catch (error) {
      console.error("[processServerResponse] Error during response processing:", error);
      return []; 
    }
  }, [enrichItineraryData]); 

  return {
    isListenerRegistered: listenerRegistered.current,
    processServerResponse // processServerResponse를 반환
  };
};

// processServerResponse를 parseServerResponse라는 이름으로 export (shim 역할)
// 또는 consumer에서 processServerResponse를 직접 사용하도록 변경할 수 있음
// 여기서는 useScheduleParser.ts에서 처리하도록 남겨둠.
// 만약 parseServerResponse라는 이름으로 export해야 한다면 아래와 같이 추가:
// export const parseServerResponse = (ssr: NewServerScheduleResponse, sd: Date, idi: ItineraryDay[]) => {
//   const { processServerResponse: psr } = useServerResponseHandler({onServerResponse: () => {}, enabled: false});
//   return psr(ssr, sd, idi);
// };
// 하지만 이는 훅 내부 로직을 외부에서 호출하는 방식이므로 권장되지 않음.
// 대신 useScheduleParser.ts에서 useServerResponseHandler의 processServerResponse를 가져와 export.
