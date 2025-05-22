
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';

/**
 * Logs debug information for parsing results
 */
export const logParseResults = (result: ItineraryDay[]): void => {
  const totalPlaces = result.reduce((sum, day) => sum + day.places.length, 0);
  const placesWithDefaultCoords = result.reduce((sum, day) => 
    sum + day.places.filter(p => p.isFallback && p.x === 126.5 && p.y === 33.4).length, 0
  );
  
  console.log('[useItineraryParser] 파싱 완료된 일정:', {
    일수: result.length,
    각일자별장소수: result.map(day => day.places.length),
    총장소수: totalPlaces,
    기본값사용장소수: placesWithDefaultCoords,
  });
  
  console.table(result.flatMap(day => day.places.map(p => ({ 
    day: day.day, 
    id: p.id, 
    name: p.name, 
    numericDbId: p.numericDbId, 
    stayDuration: p.stayDuration, 
    matched_from_payload: !p.isFallback, 
    x: p.x, 
    y: p.y 
  }))));

  if (placesWithDefaultCoords > 0) {
    console.warn(`[useItineraryParser] ${placesWithDefaultCoords}개의 장소가 기본 좌표 및 정보를 사용합니다. 상세 정보 매칭에 실패했을 수 있습니다.`);
  }
};
