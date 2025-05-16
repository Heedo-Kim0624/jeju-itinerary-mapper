
import { ItineraryDay } from "@/types/itinerary";

/**
 * 여행 일수에 따른 최소 필요 장소 수를 계산
 * @param nDays 여행 일수
 */
export const getMinimumRecommendationCount = (nDays: number) => ({
  attraction: 4 * nDays, // 관광지
  restaurant: 3 * nDays, // 음식점
  cafe: 3 * nDays,       // 카페
  accommodation: 1,      // 숙소 (여행 기간 전체에 대해 1개로 고정)
});

/**
 * 일정 객체에서 특정 날짜의 장소 목록을 반환
 * @param day 조회할 날짜(일차)
 * @param itinerarySchedule 일정 객체
 */
export const getDayPlaces = (day: number, itinerarySchedule: ItineraryDay[]) => {
  if (!itinerarySchedule || itinerarySchedule.length === 0) return null;
  
  const daySchedule = itinerarySchedule.find(d => d.day === day);
  return daySchedule ? daySchedule.places : null;
};

/**
 * 특정 장소가 포함된 일자를 찾음
 * @param placeId 장소 ID
 * @param itinerarySchedule 일정 객체
 */
export const findDayByPlaceId = (placeId: string, itinerarySchedule: ItineraryDay[]): number | null => {
  if (!itinerarySchedule || itinerarySchedule.length === 0) return null;
  
  for (const day of itinerarySchedule) {
    if (day.places && day.places.some(place => place.id === placeId)) {
      return day.day;
    }
  }
  return null;
};

/**
 * 일정 객체의 유효성을 검사
 * @param itinerary 검사할 일정 객체
 */
export const isValidItinerary = (itinerary: ItineraryDay[] | null): boolean => {
  if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
    return false;
  }
  
  // 기본적인 구조 검증
  return itinerary.every(day => 
    typeof day === 'object' &&
    day !== null &&
    'day' in day &&
    'places' in day &&
    Array.isArray(day.places)
  );
};
