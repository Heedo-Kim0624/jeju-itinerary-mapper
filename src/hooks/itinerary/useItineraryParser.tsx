
import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, ItineraryDay, Place } from '@/types/core';
import { createDayMapping } from './parser-utils/dayMapping';
import { buildItineraryDays } from './parser-utils/itineraryBuilder';
import { logParseResults } from './parser-utils/debugUtils';
import { usePlaceContext } from '@/contexts/PlaceContext'; 

export const useItineraryParser = () => {
  const { getPlaceById, allPlacesMapByName } = usePlaceContext(); // allPlacesMapByName 추가

  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    tripStartDate: Date | null = null
  ): ItineraryDay[] => {
    console.groupCollapsed('[PARSE_SERVER_RESPONSE] 서버 응답 파싱 시작');
    console.log('원본 서버 응답 데이터:', JSON.stringify(serverResponse, null, 2));
    console.log('여행 시작일:', tripStartDate);
    console.log('사용 가능한 장소 이름-ID 매핑:', allPlacesMapByName);
    
    if (!serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터(schedule 또는 route_summary)가 없습니다:', serverResponse);
      console.groupEnd();
      return [];
    }

    const scheduleByDay = new Map<string, ServerScheduleItem[]>();
    serverResponse.schedule.forEach(item => {
      const dayKey = item.time_block.split('_')[0]; 
      if (!scheduleByDay.has(dayKey)) {
        scheduleByDay.set(dayKey, []);
      }
      scheduleByDay.get(dayKey)?.push(item);
    });
    
    const dayMapping = createDayMapping([...scheduleByDay.keys()]);
    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    // allPlacesMapByName 전달
    const result = buildItineraryDays(
      serverResponse,
      tripStartDate,
      dayMapping,
      getPlaceById,
      allPlacesMapByName // 추가된 인자
    );
    
    logParseResults(result);
    
    console.groupEnd();
    return result;
  }, [getPlaceById, allPlacesMapByName]); // 의존성 배열에 allPlacesMapByName 추가

  return { parseServerResponse };
};
