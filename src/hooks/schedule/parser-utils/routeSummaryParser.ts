
import { 
  ItineraryDay, 
  ItineraryPlaceWithTime, 
  ServerScheduleItem, 
  ServerRouteSummaryItem,
  SelectedPlace
} from '@/types/core';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { getDateStringMMDD, getDayOfWeekString } from '../../itinerary/itineraryUtils';
import { createPlaceWithTimeFromSchedule } from './itineraryPlaceUtils';

// Helper: 서버의 단일 route_summary 아이템을 ItineraryDay 객체로 변환
export function parseSingleRouteSummary(
  summaryItem: ServerRouteSummaryItem,
  dayIndex: number, // 0부터 시작하는 인덱스 (일정의 순서)
  allScheduleItems: ServerScheduleItem[],
  tripStartDate: Date,
  currentSelectedPlaces: SelectedPlace[],
  dayOfWeekMap: { [key: string]: number }
): ItineraryDay {
  const routeDayAbbrev = summaryItem.day.substring(0, 3); // "Mon", "Tue" 등
  const routeDayOfWeekIndex = dayOfWeekMap[routeDayAbbrev];
  const tripStartDayOfWeekIndex = tripStartDate.getDay();

  let dayNumberOffset = routeDayOfWeekIndex - tripStartDayOfWeekIndex;
  if (dayNumberOffset < 0) dayNumberOffset += 7; 

  const currentTripDate = new Date(tripStartDate);
  currentTripDate.setDate(tripStartDate.getDate() + dayNumberOffset + (dayIndex > 0 && routeDayOfWeekIndex < tripStartDayOfWeekIndex ? 7 * Math.floor(dayIndex / Object.keys(dayOfWeekMap).length) : 0) ); // 주차를 고려한 날짜 조정 추가 가능성

  // tripDayNumber는 서버 응답 순서(index)를 기반으로 1부터 시작
  const tripDayNumber = dayIndex + 1;

  const placesForThisDay: ItineraryPlaceWithTime[] = (summaryItem.places_routed || []).map(
    (placeName, placeIdx) => createPlaceWithTimeFromSchedule(
      placeName,
      placeIdx,
      routeDayAbbrev, // 현재 요일 약자 전달
      allScheduleItems,
      currentSelectedPlaces
    )
  );
  
  const interleaved_route = summaryItem.interleaved_route || [];

  return {
    day: tripDayNumber,
    places: placesForThisDay,
    totalDistance: summaryItem.total_distance_m / 1000, // m에서 km로 변환
    interleaved_route: interleaved_route,
    routeData: {
      nodeIds: extractAllNodesFromRoute(interleaved_route).map(String),
      linkIds: extractAllLinksFromRoute(interleaved_route).map(String),
      // segmentRoutes는 현재 서버 응답에서 직접 제공되지 않으므로 빈 배열로 초기화
      segmentRoutes: [], 
    },
    dayOfWeek: getDayOfWeekString(currentTripDate), // itineraryUtils 사용
    date: getDateStringMMDD(currentTripDate),     // itineraryUtils 사용
  };
}
