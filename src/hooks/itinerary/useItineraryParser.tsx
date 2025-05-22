import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload } from '@/types/core';
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace } from '@/types/core';
import { createDayMapping } from './parser-utils/dayMapping';
import { buildItineraryDays } from './parser-utils/itineraryBuilder';
import { logParseResults } from './parser-utils/debugUtils';
import { mergeScheduleItems } from './parser-utils/mergeScheduleItems';

export const useItineraryParser = () => {
  /**
   * Main function to parse server response into itinerary data
   */
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    currentSelectedPlaces: SelectedPlace[] = [],
    tripStartDate: Date | null = null,
    lastPayload: SchedulePayload | null = null
  ): ItineraryDay[] => {
    console.group('[PARSE_SERVER_RESPONSE] 서버 응답 파싱 시작');
    console.log('원본 서버 응답 데이터:', JSON.stringify(serverResponse, null, 2));
    console.log('현재 선택된 장소 (상세정보용) 수:', currentSelectedPlaces.length);
    console.log('여행 시작일:', tripStartDate);
    console.log('마지막으로 보낸 페이로드:', lastPayload ? '있음' : '없음 (null)');
    
    if (lastPayload) {
        console.log('마지막 페이로드 상세:', JSON.stringify(lastPayload, null, 2));
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
    const result = buildItineraryDays(
      serverResponse,
      currentSelectedPlaces,
      tripStartDate,
      lastPayload,
      dayMapping
    );
    
    // Log debug information
    logParseResults(result);
    
    console.groupEnd(); // End PARSE_SERVER_RESPONSE group
    return result;
  }, []);

  return { parseServerResponse };
};
