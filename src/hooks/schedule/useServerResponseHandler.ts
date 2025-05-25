
import { useCallback, useEffect, useRef } from 'react';
import { NewServerScheduleResponse, ItineraryDay, ServerScheduleItem, ItineraryPlaceWithTime, RouteData, ServerRouteSummaryItem } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/parser-utils/timeUtils';
import { useSupabaseDataFetcher } from '../data/useSupabaseDataFetcher';
import { useItineraryEnricher } from '../itinerary/useItineraryEnricher';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; 
import { dayStringToIndex } from '@/utils/date/dayMapping'; 

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
  const { initializeFromServerResponse: initializeRouteStore, clearAllRouteData, isInitialized: isRouteStoreInitialized, setInitialized: setRouteStoreInitialized } = useRouteMemoryStore();

  const handleRawServerResponse = useCallback(async (event: Event) => {
    const customEvent = event as CustomEvent<{response: NewServerScheduleResponse}>;
    const serverResponse = customEvent.detail?.response;
    
    console.log('[useServerResponseHandler] rawServerResponseReceived event received:', serverResponse);
    
    if (serverResponse) {
      try {
        await fetchAllCategoryData(); 
        
        // Assuming a default or placeholder startDate for parsing if not readily available here.
        // The primary role here is to get ItineraryDay[] for the store's place data.
        const tempStartDate = new Date(); // This might need to come from context or props.
        const parsedItineraryDaysForStore = parseServerResponse(serverResponse, tempStartDate);

        if (isRouteStoreInitialized) {
            console.log('[useServerResponseHandler] Route store was initialized, clearing before new data.');
            clearAllRouteData(); 
        }
        initializeRouteStore(serverResponse, parsedItineraryDaysForStore);
        
        onServerResponse(serverResponse); 

      } catch (error) {
        console.error("[useServerResponseHandler] Error processing server response:", error);
        setRouteStoreInitialized(true); 
      }
    } else {
      console.error("[useServerResponseHandler] Server response event did not contain a valid response.");
    }
  }, [onServerResponse, fetchAllCategoryData, initializeRouteStore, clearAllRouteData, isRouteStoreInitialized, setRouteStoreInitialized]);

  useEffect(() => {
    if (enabled && !listenerRegistered.current) {
      console.log('[useServerResponseHandler] Registering server response event listener.');
      window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
      listenerRegistered.current = true;
      
      return () => {
        console.log('[useServerResponseHandler] Unregistering server response event listener.');
        window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
        listenerRegistered.current = false;
      };
    } else if (!enabled && listenerRegistered.current) {
      console.log('[useServerResponseHandler] Disabling server response event listener (enabled=false).');
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
      listenerRegistered.current = false;
    }
  }, [enabled, handleRawServerResponse]);

  const processServerResponseLocal = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date
  ): ItineraryDay[] => {
    console.log("[processServerResponseLocal] Server response processing for itinerary structure started.");
    try {
      const parsedItinerary = parseServerResponse(serverResponse, startDate);
      console.log("[processServerResponseLocal] Basic parsing complete:", parsedItinerary.length, "days generated.");
      const enrichedItinerary = enrichItineraryData(parsedItinerary);
      console.log("[processServerResponseLocal] Supabase data enrichment complete.");
      return enrichedItinerary;
    } catch (error) {
      console.error("[processServerResponseLocal] Error processing response:", error);
      return [];
    }
  }, [enrichItineraryData]);

  return {
    isListenerRegistered: listenerRegistered.current,
    processAndEnrichServerResponse: processServerResponseLocal 
  };
};

export const parseServerResponse = (
  serverResponse: NewServerScheduleResponse,
  startDate: Date
): ItineraryDay[] => {
  console.log("[parseServerResponse] Parsing server response for ItineraryDay structure:", serverResponse);
  
  try {
    if (!serverResponse || !serverResponse.schedule || !serverResponse.route_summary) {
      console.error("[parseServerResponse] Server response missing schedule or route_summary data.");
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
    
    const routeSummaryByDay = serverResponse.route_summary.reduce((acc, item) => {
      acc[item.day] = item;
      return acc;
    }, {} as Record<string, ServerRouteSummaryItem>);
    
    const daysOfWeekFromSummary = serverResponse.route_summary.map(item => item.day);
    
    const itineraryDaysResult: ItineraryDay[] = [];

    daysOfWeekFromSummary.forEach((dayOfWeekKey) => {
      const dayIndex = dayStringToIndex(dayOfWeekKey);
      if (dayIndex === null) {
        console.warn(`[parseServerResponse] Invalid day key '${dayOfWeekKey}' from route_summary. Skipping this day.`);
        return; 
      }

      const dayScheduleItems = scheduleByDay[dayOfWeekKey] || [];
      const dayRouteSummary = routeSummaryByDay[dayOfWeekKey];
      
      const currentDayDate = new Date(startDate.getTime() + (dayIndex - 1) * 24 * 60 * 60 * 1000);
      const dateStr = getDateStringMMDD(currentDayDate);
      
      const placesForDay: ItineraryPlaceWithTime[] = dayScheduleItems.map((scheduleItem: ServerScheduleItem) => {
        const placeId = scheduleItem.id?.toString() || scheduleItem.place_name;
        return {
          id: placeId,
          name: scheduleItem.place_name,
          category: scheduleItem.place_type,
          timeBlock: scheduleItem.time_block,
          x: 0, y: 0, address: '', road_address: '', phone: '', description: '', rating: 0, 
          image_url: '', homepage: '', arriveTime: undefined, departTime: undefined,
          stayDuration: undefined, travelTimeToNext: undefined, geoNodeId: placeId,
          isFallback: true, isSelected: false, isCandidate: false,
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
      
      const finalInterleavedRoute = currentInterleavedRoute.map(id => String(id));

      const routeData: RouteData = {
        nodeIds,
        linkIds,
        segmentRoutes: [],
      };

      itineraryDaysResult.push({
        day: dayIndex, 
        date: dateStr,
        dayOfWeek: dayOfWeekKey, 
        places: placesForDay,
        totalDistance: dayRouteSummary?.total_distance_m ? dayRouteSummary.total_distance_m / 1000 : 0,
        routeData: routeData,
        interleaved_route: finalInterleavedRoute,
      });
    });
    
    itineraryDaysResult.sort((a, b) => a.day - b.day);

    return itineraryDaysResult;

  } catch (error) {
    console.error("[parseServerResponse] Error parsing server response:", error);
    return [];
  }
};
