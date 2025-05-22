import { useCallback } from 'react';
import { Place } from '@/types/core';

interface UseItineraryCreatorCoreProps {
  // Define props here
}

/**
 * 일정 생성 로직의 핵심을 담당하는 훅
 */
export const useItineraryCreatorCore = ({}: UseItineraryCreatorCoreProps) => {

  // 문자열 ID를 숫자로 변환하는 함수 추가
  const safeParseInt = (id: string | number): number => {
    if (typeof id === 'number') return id;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  /**
   * 특정 카테고리에 대해 유사한 장소 목록을 가져옵니다.
   * @param category 장소 카테고리
   * @param referencePlace 기준 장소
   * @param allPlaces 모든 장소 목록
   * @param count 가져올 유사한 장소 수 (기본값: 3)
   * @returns 유사한 장소 목록
   */
  const getSimilarPlaces = (category: string, referencePlace: Place, allPlaces: Place[], count: number = 3): Place[] => {
    // 동일한 카테고리의 장소만 필터링
    const sameCategoryPlaces = allPlaces.filter(place => place.category === category && place.id !== referencePlace.id);

    if (sameCategoryPlaces.length === 0) {
      return [];
    }

    // 각 장소에 대한 유사성 점수 계산 (간단한 거리 기반)
    const scoredPlaces = sameCategoryPlaces.map(place => {
      const dx = place.x - referencePlace.x;
      const dy = place.y - referencePlace.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { place, score: 1 / (1 + distance) }; // 거리가 멀수록 점수가 낮아짐
    });

    // 점수를 기준으로 정렬하고 상위 N개 장소 선택
    scoredPlaces.sort((a, b) => b.score - a.score);
    const similarPlaces = scoredPlaces.slice(0, count).map(scoredPlace => scoredPlace.place);

    return similarPlaces;
  };

  return {
    getSimilarPlaces,
  };
};
