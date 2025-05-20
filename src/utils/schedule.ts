
import { Place } from '@/types/supabase';

export interface PlaceWithUsedFlag extends Place {
  usedInItinerary?: boolean;
}

// createEmptyScheduleTable 함수는 사용되지 않으므로 삭제되었습니다.
// categorizeAndFlagPlaces 함수는 src/hooks/itinerary-creator/placeCategorizer.ts의 기능과 유사하고
// 현재 코드베이스에서 사용되지 않으므로 삭제되었습니다.

/**
 * 현재 위치에서 가장 가까운 장소를 찾습니다. (사용되지 않은 장소 중에서)
 * @param currentPlace 현재 위치를 나타내는 장소 객체
 * @param remainingPlaces 검색 대상이 되는 장소 배열 (PlaceWithUsedFlag 형태)
 * @param calculateDistance 두 장소 간의 거리를 계산하는 함수
 * @returns 가장 가까운 장소 또는 null (사용 가능한 장소가 없을 경우)
 */
export const findNearestPlace = (
  currentPlace: Place,
  remainingPlaces: PlaceWithUsedFlag[],
  calculateDistance: (p1: Place, p2: Place) => number
): PlaceWithUsedFlag | null => {
  if (remainingPlaces.length === 0) return null;
  
  const availablePlaces = remainingPlaces.filter(p => !p.usedInItinerary);
  if (availablePlaces.length === 0) return null;
  
  // 초기값 설정: 사용 가능한 장소 중 첫 번째 장소를 가장 가까운 장소로 가정
  let nearestPlace = availablePlaces[0];
  // currentPlace와 nearestPlace의 유효성 검사 추가
  if (!currentPlace || !nearestPlace) {
    // 둘 중 하나라도 유효하지 않으면 첫 번째 사용 가능한 장소를 반환하거나, null을 반환할 수 있습니다.
    // 여기서는 availablePlaces[0]이 존재함이 보장되므로 nearestPlace를 반환합니다.
    // 다만, calculateDistance 함수가 null을 적절히 처리할 수 있어야 합니다.
    // 또는, 이 경우 로직을 다르게 처리 (예: 오류 로깅, null 반환 등)
    // 현재 로직은 calculateDistance가 null인 x,y를 처리할 수 있다고 가정합니다.
     return nearestPlace; 
  }
  
  let minDistance = calculateDistance(currentPlace, nearestPlace);
  
  for (let i = 1; i < availablePlaces.length; i++) {
    const placeToCompare = availablePlaces[i];
    // placeToCompare 유효성 검사
    if (!placeToCompare) continue;

    const distance = calculateDistance(currentPlace, placeToCompare);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPlace = placeToCompare;
    }
  }
  
  return nearestPlace;
};

