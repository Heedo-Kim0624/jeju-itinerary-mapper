
import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem } from '@/types/core';
// SelectedPlace is removed as it's not passed down for detail fetching anymore.
// It might be needed if the parser itself uses it for other top-level logic.
// For now, assuming its primary use was for detail fetching propagated downwards.
// import { SelectedPlace } from '@/types/core';
import { ItineraryDay } from '@/types/core'; // ItineraryPlaceWithTime removed as it's a sub-type
import { createDayMapping } from './parser-utils/dayMapping';
import { buildItineraryDays } from './parser-utils/itineraryBuilder';
import { logParseResults } from './parser-utils/debugUtils';
// mergeScheduleItems is not used in this file, consider removing if not needed elsewhere by this hook.
// import { mergeScheduleItems } from './parser-utils/mergeScheduleItems';
import { usePlaceContext } from '@/contexts/PlaceContext'; // Import usePlaceContext

export const useItineraryParser = () => {
  const { getPlaceById } = usePlaceContext(); // Get getPlaceById from PlaceContext

  /**
   * Main function to parse server response into itinerary data
   */
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    tripStartDate: Date | null = null
  ): ItineraryDay[] => {
    console.groupCollapsed('[PARSE_SERVER_RESPONSE] 서버 응답 파싱 시작');
    console.log('원본 서버 응답 데이터:', JSON.stringify(serverResponse, null, 2));
    console.log('여행 시작일:', tripStartDate);
    
    // Validate server response
    if (!serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터(schedule 또는 route_summary)가 없습니다:', serverResponse);
      console.groupEnd();
      return [];
    }

    // Organize schedules by day (This part seems okay, it's for structuring, not detail fetching)
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
    // Parameters to buildItineraryDays updated
    // Pass getPlaceById as the callback
    const result = buildItineraryDays(
      serverResponse,
      tripStartDate,
      dayMapping,
      getPlaceById 
    );
    
    // Log debug information
    logParseResults(result);
    
    console.groupEnd(); // End PARSE_SERVER_RESPONSE group
    return result;
  }, [getPlaceById]); // Add getPlaceById to useCallback dependencies

  return { parseServerResponse };
};

