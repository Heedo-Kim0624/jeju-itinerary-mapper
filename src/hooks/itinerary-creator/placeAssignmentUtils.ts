// 기존 임포트 유지
import { Place } from '@/types/core';

// 모든 ID를 문자열로 처리하도록 변경
const convertPlaceIdToString = (place: Place): Place => {
  return {
    ...place,
    id: String(place.id) // id를 항상 string으로 변환
  };
};

export function assignPlacesToDays(places: Place[], numberOfDays: number): Place[][] {
  // 먼저 모든 장소의 ID를 문자열로 변환
  const placesWithStringIds = places.map(convertPlaceIdToString);
  
  const days: Place[][] = Array.from({ length: numberOfDays }, () => []);
  const numPlaces = placesWithStringIds.length;

  if (numPlaces === 0) {
    return days; // No places to assign
  }

  const basePlacesPerDay = Math.floor(numPlaces / numberOfDays);
  const extraPlaces = numPlaces % numberOfDays;

  let placeIndex = 0;
  for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex++) {
    const placesForDay = basePlacesPerDay + (dayIndex < extraPlaces ? 1 : 0);
    for (let i = 0; i < placesForDay; i++) {
      if (placeIndex < numPlaces) {
        days[dayIndex].push(placesWithStringIds[placeIndex]);
        placeIndex++;
      }
    }
  }

  return days;
}
