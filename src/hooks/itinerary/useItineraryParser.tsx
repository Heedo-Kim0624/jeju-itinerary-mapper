
import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload } from '@/types/core';
import { ItineraryDay, SelectedPlace as CoreSelectedPlace } from '@/types/core'; // Renamed to avoid conflict with Place from supabase
import { createDayMapping } from './parser-utils/dayMapping';
import { buildItineraryDays } from './parser-utils/itineraryBuilder';
import { logParseResults } from './parser-utils/debugUtils';
// Removed mergeScheduleItems as it's not used directly here and might be part of buildItineraryDays logic or PlaceProvider
import { usePlaces } from '@/contexts/PlaceContext'; // Import the new hook

export const useItineraryParser = () => {
  const { getPlaceById, getPlaceByName, isPlacesLoading, placesMap } = usePlaces();

  /**
   * Main function to parse server response into itinerary data
   */
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    // currentSelectedPlaces is no longer the primary source for details, but might be used for ID hints from payload
    currentSelectedPlacesOriginal: CoreSelectedPlace[] = [], 
    tripStartDate: Date | null = null,
    lastPayload: SchedulePayload | null = null
  ): ItineraryDay[] => {
    console.group('[PARSE_SERVER_RESPONSE] 서버 응답 파싱 시작');
    console.log('원본 서버 응답 데이터:', JSON.stringify(serverResponse, null, 2));
    console.log('여행 시작일:', tripStartDate);
    console.log('마지막으로 보낸 페이로드:', lastPayload ? '있음' : '없음 (null)');
    
    if (lastPayload) {
        console.log('마지막 페이로드 상세:', JSON.stringify(lastPayload, null, 2));
    }

    if (isPlacesLoading) {
      console.warn('[useItineraryParser] Places are still loading. Parsing might be incomplete or use fallbacks.');
      // Optionally, return empty or throw an error, or wait. For now, proceed with caution.
    }
    
    if (placesMap.size === 0 && !isPlacesLoading) {
        console.warn('[useItineraryParser] Place store is empty. Details might be missing for all places.');
    }


    // Validate server response
    if (!serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터(schedule 또는 route_summary)가 없습니다:', serverResponse);
      console.groupEnd();
      return [];
    }

    // Organize schedules by day
    const scheduleByDay = new Map<string, ServerScheduleItem[]>();
    serverResponse.schedule.forEach(item => {
      const dayKey = item.time_block.split('_')[0]; 
      if (!scheduleByDay.has(dayKey)) {
        scheduleByDay.set(dayKey, []);
      }
      scheduleByDay.get(dayKey)?.push(item);
    });
    
    // Create day mapping (day of week to day number)
    const dayMapping = createDayMapping([...scheduleByDay.keys()]);
    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    // Build itinerary days
    // Pass getPlaceById and getPlaceByName to where scheduleItemProcessor is used
    // This means buildItineraryDays and its chain of calls will need to accept these
    const result = buildItineraryDays(
      serverResponse,
      getPlaceById, // Pass the function from usePlaces
      getPlaceByName, // Pass the function from usePlaces
      tripStartDate,
      lastPayload, // lastPayload might still be useful for hints
      dayMapping,
      currentSelectedPlacesOriginal // Pass original selected places for potential ID hints from payload matching
    );
    
    // Log debug information
    logParseResults(result);
    
    console.groupEnd(); // End PARSE_SERVER_RESPONSE group
    return result;
  }, [getPlaceById, getPlaceByName, isPlacesLoading, placesMap, tripStartDate]); // Added lastPayload and currentSelectedPlacesOriginal if they influence ID hint logic

  return { parseServerResponse };
};
