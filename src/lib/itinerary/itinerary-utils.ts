
import { Place } from '@/types/supabase';

/**
 * 선택된 장소 목록에 추천 장소를 추가하여 보완합니다
 */
export const completeWithRecommendedPlaces = async (
  selectedPlaces: Place[],
  recommendedPlaces: Place[],
  travelDays: number
): Promise<Place[]> => {
  if (!travelDays || travelDays < 1) {
    console.warn('여행 기간 정보가 없어 후보 장소를 자동 보완할 수 없습니다.');
    return selectedPlaces;
  }

  // 최종 장소 목록 (선택된 장소 + 자동 보완된 후보 장소)
  const finalPlaces: Place[] = [...selectedPlaces];
  
  // 추천 장소 중에서 이미 선택된 장소는 제외
  const availableRecommendedPlaces = recommendedPlaces.filter(
    rp => !selectedPlaces.some(sp => sp.id === rp.id)
  );
  
  // 추천 장소를 최대 10개까지만 추가 (여행 일수에 따라 조절 가능)
  const placesToAdd = availableRecommendedPlaces.slice(0, Math.min(10, travelDays * 2));
  
  if (placesToAdd.length > 0) {
    // 후보 장소에 isCandidate 속성 추가
    const markedCandidates = placesToAdd.map(p => ({
      ...p,
      isCandidate: true // 자동 추가된 후보 장소임을 표시
    }));
    
    finalPlaces.push(...markedCandidates);
    console.log(`총 ${markedCandidates.length}개의 장소가 자동으로 추가되었습니다.`);
  }
  
  return finalPlaces;
};
