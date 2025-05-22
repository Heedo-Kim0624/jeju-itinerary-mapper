

import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload } from '@/types/core';
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


export const useItineraryParser = () => {
  /**
   * Main function to parse server response into itinerary data
   */
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    // currentSelectedPlaces: SelectedPlace[] = [], // Removed
    tripStartDate: Date | null = null
    // lastPayload: SchedulePayload | null = null // Removed
  ): ItineraryDay[] => {
    console.groupCollapsed('[PARSE_SERVER_RESPONSE] 서버 응답 파싱 시작');
    console.log('원본 서버 응답 데이터:', JSON.stringify(serverResponse, null, 2));
    // console.log('현재 선택된 장소 (상세정보용) 수:', currentSelectedPlaces.length); // Removed
    console.log('여행 시작일:', tripStartDate);
    // console.log('마지막으로 보낸 페이로드:', lastPayload ? '있음' : '없음 (null)'); // Removed
    
    // if (lastPayload) { // Removed
    //     console.log('마지막 페이로드 상세:', JSON.stringify(lastPayload, null, 2));
    // }

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
    const result = buildItineraryDays(
      serverResponse,
      // currentSelectedPlaces, // Removed
      tripStartDate,
      // lastPayload, // Removed
      dayMapping
    );
    
    // Log debug information
    logParseResults(result);
    
    console.groupEnd(); // End PARSE_SERVER_RESPONSE group
    return result;
  }, []);

  return { parseServerResponse };
};

