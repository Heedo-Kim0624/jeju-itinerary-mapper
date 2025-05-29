import { ItineraryDay, NewServerScheduleResponse, Place } from '@/types/core';
import { formatDate } from './timeUtils';
import { buildGroupedItineraryPlaces } from './groupedPlacesProcessor';
import { processRouteData } from './routeSummaryProcessor';
import { organizeAndSortScheduleByDay } from './scheduleOrganizer';
import { organizeRouteByDay } from './routeOrganizer';
import type { DetailedPlace } from '@/types/detailedPlace';
import { getDayOfWeekString, getDateStringMMDD } from '../itineraryUtils';

// Helper for chronological day sort based on common English/Korean day names
const dayOrderLookup: { [key: string]: number } = {
  'Mon': 1, '월': 1,
  'Tue': 2, '화': 2,
  'Wed': 3, '수': 3,
  'Thu': 4, '목': 4,
  'Fri': 5, '금': 5,
  'Sat': 6, '토': 6,
  'Sun': 0, '일': 0  // 일요일을 0으로 변경 (JavaScript의 getDay()와 일치)
};

/**
 * 날짜 문자열을 Date 객체로 변환
 */
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // MM/DD 형식 처리
  const mmddMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (mmddMatch) {
    const month = parseInt(mmddMatch[1]) - 1; // JavaScript의 월은 0부터 시작
    const day = parseInt(mmddMatch[2]);
    const currentYear = new Date().getFullYear();
    return new Date(currentYear, month, day);
  }
  
  // 다른 형식의 날짜 문자열 처리 (필요시 추가)
  return null;
};

/**
 * 여행 시작일로부터 지정된 일수만큼 경과한 날짜 계산
 */
const addDaysToDate = (startDate: Date, days: number): Date => {
  const result = new Date(startDate);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Main function to build itinerary days from server response
 */
export const buildItineraryDays = (
  serverResponse: NewServerScheduleResponse,
  tripStartDate: Date | null = null,
  dayMapping: Record<string, number>, // This dayMapping is based on chronologically sorted day keys
  getPlaceDetailsByIdCallback: (id: number) => DetailedPlace | undefined,
  allPlacesMapByName: Map<string, Place>
): ItineraryDay[] => {
  console.log('[buildItineraryDays] 시작, 여행 시작일:', tripStartDate);
  
  const scheduleByDay = organizeAndSortScheduleByDay(serverResponse.schedule);
  const routeByDay = organizeRouteByDay(serverResponse.route_summary);

  // Get day keys from scheduleByDay and sort them chronologically
  const dayKeysFromSchedule = Array.from(scheduleByDay.keys());
  
  // 날짜 정보가 있는 경우 날짜 기준으로 정렬, 없으면 요일 기준으로 정렬
  const sortedChronologicalDayKeys = dayKeysFromSchedule.sort((a, b) => {
    // 요일 기준 정렬 (기본)
    return (dayOrderLookup[a] || 99) - (dayOrderLookup[b] || 99);
  });
  
  console.log('[buildItineraryDays] 정렬된 일자 키:', sortedChronologicalDayKeys);

  // 여행 시작일이 제공된 경우, 실제 날짜 계산
  let actualDates: Date[] = [];
  if (tripStartDate) {
    actualDates = sortedChronologicalDayKeys.map((_, index) => {
      return addDaysToDate(tripStartDate, index);
    });
    console.log('[buildItineraryDays] 계산된 실제 날짜:', 
      actualDates.map(date => `${getDateStringMMDD(date)}(${getDayOfWeekString(date)})`));
  }

  // Build itinerary for each day using chronologically sorted keys
  const itineraryDaysUnsorted = sortedChronologicalDayKeys.map((dayOfWeekKey, index) => {
    const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
    const routeInfo = routeByDay.get(dayOfWeekKey);
    
    // 1부터 시작하는 연속적인 day 번호 할당
    const dayNumber = index + 1;
    
    // 실제 날짜와 요일 계산
    let dateStr = '';
    let calculatedDayOfWeek = dayOfWeekKey;
    
    if (actualDates.length > index) {
      const actualDate = actualDates[index];
      dateStr = getDateStringMMDD(actualDate);
      calculatedDayOfWeek = getDayOfWeekString(actualDate);
      console.log(`[buildItineraryDays] 일자 ${dayNumber}: 계산된 날짜=${dateStr}, 요일=${calculatedDayOfWeek}`);
    }

    // Parameters to buildGroupedItineraryPlaces updated
    // Pass the callback function here
    const groupedPlaces = buildGroupedItineraryPlaces(
      dayItemsOriginal,
      getPlaceDetailsByIdCallback, 
      dayNumber,
      allPlacesMapByName
    );

    // Process route data using the routeSummaryProcessor utility
    // processRouteData can handle undefined routeInfo gracefully
    const { nodeIds, linkIds, interleaved_route, totalDistance, segmentRoutes } = processRouteData(routeInfo);

    // 각 일자별 데이터 로깅
    console.log(`[buildItineraryDays] 일자 ${dayNumber}(${calculatedDayOfWeek}) 데이터 생성:`, {
      date: dateStr,
      placesCount: groupedPlaces.length,
      firstPlaceId: groupedPlaces[0]?.id,
      lastPlaceId: groupedPlaces[groupedPlaces.length - 1]?.id
    });

    return {
      day: dayNumber,
      dayOfWeek: calculatedDayOfWeek,
      date: dateStr,
      places: groupedPlaces,
      totalDistance: totalDistance,
      routeData: {
        nodeIds: nodeIds,
        linkIds: linkIds,
        segmentRoutes: segmentRoutes
      },
      interleaved_route: interleaved_route
    };
  });

  // Sort the final ItineraryDay array by the 'day' number to be absolutely sure
  const sortedItineraryDays = itineraryDaysUnsorted.sort((a, b) => a.day - b.day);

  // 최종 데이터 구조 로깅
  console.log('[buildItineraryDays] 최종 itinerary 데이터 구조:', 
    sortedItineraryDays.map(day => ({
      day: day.day,
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      placesCount: day.places.length,
      placesIds: day.places.map(p => p.id).slice(0, 3) // 처음 3개 ID만 로깅
    }))
  );

  // 각 일자별 places 배열이 서로 다른 참조인지 확인
  const placesReferences: any = {};
  sortedItineraryDays.forEach(day => {
    placesReferences[`day${day.day}`] = {
      reference: day.places,
      count: day.places.length
    };
  });
  console.log('[buildItineraryDays] 일자별 places 배열 참조 확인:', placesReferences);

  // 깊은 복사를 통해 완전히 새로운 객체 반환
  return JSON.parse(JSON.stringify(sortedItineraryDays));
};
