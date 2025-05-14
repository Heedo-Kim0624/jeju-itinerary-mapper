
// 일정 관련 유틸리티 함수들

import { Place, ItineraryDay } from '@/types/supabase';

/**
 * 여행 일수에 따른 각 카테고리별 필요한 최소 장소 수를 계산합니다.
 */
export const calculateMinimumPlaceCounts = (travelDays: number) => {
  return {
    attraction: 4 * travelDays,  // 관광지: 일당 4개
    restaurant: 3 * travelDays,  // 식당: 일당 3개
    cafe: 3 * travelDays,        // 카페: 일당 3개
    accommodation: 1             // 숙소: 1개 (고정)
  };
};

/**
 * 선택된 장소들을 카테고리별로 분류하고, 여행 일수에 맞게 필요한 추가 장소 수를 계산합니다.
 */
export const getAdditionalPlaceCountNeeded = (
  selectedPlaces: Place[], 
  travelDays: number
) => {
  // 카테고리별 분류
  const categorizedPlaces = {
    attraction: selectedPlaces.filter(p => p.category === 'attraction').length,
    restaurant: selectedPlaces.filter(p => p.category === 'restaurant').length,
    cafe: selectedPlaces.filter(p => p.category === 'cafe').length,
    accommodation: selectedPlaces.filter(p => p.category === 'accommodation').length,
  };

  // 최소 필요 장소 수
  const minCounts = calculateMinimumPlaceCounts(travelDays);

  // 카테고리별 추가 필요 장소 수 계산
  return {
    attraction: Math.max(0, minCounts.attraction - categorizedPlaces.attraction),
    restaurant: Math.max(0, minCounts.restaurant - categorizedPlaces.restaurant),
    cafe: Math.max(0, minCounts.cafe - categorizedPlaces.cafe),
    accommodation: Math.max(0, minCounts.accommodation - categorizedPlaces.accommodation),
  };
};

/**
 * 선택된 장소와 추천 장소 목록을 합쳐 최종 장소 목록을 생성합니다.
 * 각 카테고리별 최소 필요 수를 만족시키도록 추천 장소에서 추가합니다.
 */
export const completeWithRecommendedPlaces = (
  selectedPlaces: Place[], 
  recommendedPlaces: Place[],
  travelDays: number
): Place[] => {
  // 이미 선택된 장소의 ID 목록
  const selectedPlaceIds = new Set(selectedPlaces.map(p => p.id));
  
  // 카테고리별 추가 필요 수
  const additionalNeeded = getAdditionalPlaceCountNeeded(selectedPlaces, travelDays);
  
  // 카테고리별 결과 목록 생성
  const result = [...selectedPlaces];
  
  // 카테고리별로 필요한 만큼 추천 장소에서 추가
  ['attraction', 'restaurant', 'cafe', 'accommodation'].forEach(category => {
    if (additionalNeeded[category as keyof typeof additionalNeeded] > 0) {
      // 해당 카테고리의 추천 장소 중 아직 선택되지 않은 장소만 필터링
      const availableRecommended = recommendedPlaces
        .filter(p => p.category === category && !selectedPlaceIds.has(p.id))
        // 가중치(weight) 기준 내림차순 정렬 (가장 추천도가 높은 것부터)
        .sort((a, b) => (b.weight || 0) - (a.weight || 0));
      
      // 필요한 수만큼 추가
      const placesToAdd = availableRecommended.slice(0, additionalNeeded[category as keyof typeof additionalNeeded]);
      result.push(...placesToAdd);
    }
  });
  
  return result;
};

/**
 * 일정 시각화를 위한 경로 데이터 유효성 확인
 */
export const hasValidRouteData = (itineraryDay: ItineraryDay): boolean => {
  if (!itineraryDay.routeData) return false;
  
  const { nodeIds, linkIds } = itineraryDay.routeData;
  return Boolean(nodeIds?.length && linkIds?.length);
};
