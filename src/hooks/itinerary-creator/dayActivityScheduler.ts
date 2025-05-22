// 기존 임포트 유지
import { Place } from '@/types/core';

// 모든 ID를 문자열로 처리하도록 변경
const convertPlaceIdToString = (place: Place): Place => {
  return {
    ...place,
    id: String(place.id) // id를 항상 string으로 변환
  };
};

export const scheduleDayActivities = (places: Place[], dayIndex: number): Place[] => {
  // 먼저 모든 장소의 ID를 문자열로 변환
  const placesWithStringIds = places.map(convertPlaceIdToString);
  
  // 간단한 예시: 장소들을 순서대로 반환
  console.log(`[scheduleDayActivities] Day ${dayIndex + 1}: Scheduled ${placesWithStringIds.length} activities.`);
  return placesWithStringIds;
};
