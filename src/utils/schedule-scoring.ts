import { Place } from '@/types/supabase';
import { ItineraryScore } from './schedule-types';

/**
 * 경로 거리 계산 (간단한 구현, OSM 데이터 통합 시 교체 필요)
 * 
 * @param places 경로에 포함된 장소 배열
 * @returns 총 이동 거리 (km)
 */
export const calculateRouteDistance = (places: Place[]): number => {
  if (places.length <= 1) return 0;
  
  let totalDistance = 0;
  
  for (let i = 0; i < places.length - 1; i++) {
    const p1 = places[i];
    const p2 = places[i + 1];
    
    // 두 지점 간 직선 거리 계산 (Haversine formula)
    const R = 6371; // 지구 반경 (km)
    const dLat = (p2.y - p1.y) * Math.PI / 180;
    const dLon = (p2.x - p1.x) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.y * Math.PI / 180) * Math.cos(p2.y * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    totalDistance += distance;
  }
  
  return totalDistance;
};

/**
 * 일정 점수 계산
 * 
 * @param places 일정에 포함된 장소 배열
 * @returns 일정 점수 객체
 */
export const calculateItineraryScore = (places: Place[]): ItineraryScore => {
  // 모든 장소가 일정에 포함되면 기본 1000점
  const baseScore = 1000;
  
  // 총 이동 거리 계산
  const totalDistance = calculateRouteDistance(places);
  
  // 이동 거리에 따른 감점 (거리 km × -0.001)
  const distancePenalty = totalDistance * -0.001;
  
  // 최종 점수 계산
  const score = baseScore + distancePenalty;
  
  return {
    score,
    totalDistance,
    placesCount: places.length
  };
};

/**
 * HuggingFace LLM 모델을 사용하여 최적 장소 순서 생성
 * 
 * @param places 장소 배열
 * @param prompt 사용자 프롬프트
 * @returns 최적화된 장소 ID 배열
 */
export const generateOptimalPlaceOrder = async (
  places: Place[],
  prompt: string
): Promise<string[]> => {
  // Fix: Convert place.id to string before returning
  return places.map(place => String(place.id));
};

/**
 * OSM 데이터를 활용한 최적 경로 생성
 * 
 * @param places 장소 배열 (순서 정렬됨)
 * @returns 최적화된 경로 정보
 */
export const generateOptimalRoute = (places: Place[]) => {
  // TODO: OSM node, link, turntype 데이터를 활용한 경로 생성 로직 구현
  return {
    totalDistance: calculateRouteDistance(places),
    duration: places.length * 20 // 임시 소요 시간 (분)
  };
};
