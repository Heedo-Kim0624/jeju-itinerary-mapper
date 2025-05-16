
import { Place } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Calculate minimum recommendation count for each category based on trip duration
 * @param nDays Trip duration in days
 */
export const getMinimumRecommendationCount = (nDays: number) => ({
  attraction: Math.max(4, Math.ceil(4 * nDays)), // 관광지
  restaurant: Math.max(3, Math.ceil(3 * nDays)), // 식당
  cafe: Math.max(3, Math.ceil(3 * nDays)),       // 카페
  accommodation: nDays > 1 ? nDays - 1 : 1,      // 숙소 - n박 여행에는 최대 n-1개 숙소 필요
});

/**
 * Auto-complete candidate places for each category to meet minimum requirements
 * 
 * @param selectedPlaces User-selected places
 * @param recommendedPlacesByCategory Available recommended places by category
 * @param tripDuration Trip duration in days
 * @returns Complete list of places including added candidate places
 */
export const autoCompleteCandidatePlaces = (
  selectedPlaces: Place[], 
  recommendedPlacesByCategory: Record<string, Place[]>, 
  tripDuration: number
): {
  finalPlaces: Place[],
  addedPlaces: Place[]
} => {
  console.log("[자동 보완] 자동 보완 함수 호출됨", {
    여행일수: tripDuration,
    선택된_장소_수: selectedPlaces.length,
    추천_카테고리_목록: Object.keys(recommendedPlacesByCategory)
  });
  
  if (!tripDuration || tripDuration < 1) {
    console.warn('[자동 보완] 여행 기간 정보가 없어 후보 장소를 자동 보완할 수 없습니다.');
    return { finalPlaces: selectedPlaces, addedPlaces: [] };
  }
  
  // Calculate minimum requirements for each category
  const minimumRequirements = getMinimumRecommendationCount(tripDuration);
  console.log('[자동 보완] 카테고리별 최소 필요 장소 수:', minimumRequirements);
  
  // Map from English category to Korean
  const categoryEngToKorMapping: Record<string, string> = {
    'attraction': '관광지',
    'restaurant': '음식점',
    'cafe': '카페',
    'accommodation': '숙소'
  };
  
  const categoryKorToEngMapping: Record<string, string> = {
    '관광지': 'attraction',
    '음식점': 'restaurant',
    '카페': 'cafe',
    '숙소': 'accommodation'
  };

  // Group selected places by category
  const selectedPlacesByCategory: Record<string, Place[]> = {
    '숙소': [], '관광지': [], '음식점': [], '카페': [], '기타': []
  };
  
  selectedPlaces.forEach(place => {
    const category = getCategoryKorean(place.category);
    if (selectedPlacesByCategory[category]) {
      selectedPlacesByCategory[category].push(place);
    } else {
      selectedPlacesByCategory['기타'].push(place);
    }
  });
  
  console.log('[자동 보완] 현재 카테고리별 선택된 장소:', {
    숙소: selectedPlacesByCategory['숙소'].length,
    관광지: selectedPlacesByCategory['관광지'].length,
    음식점: selectedPlacesByCategory['음식점'].length,
    카페: selectedPlacesByCategory['카페'].length,
    총장소수: selectedPlaces.length
  });
  
  const finalPlaces: Place[] = [...selectedPlaces];
  const addedCandidatePlaces: Place[] = [];
  
  // Check each category for minimum requirements
  Object.entries(minimumRequirements).forEach(([categoryEng, minCount]) => {
    const categoryKorean = categoryEngToKorMapping[categoryEng];
    if (!categoryKorean) {
      console.warn(`[자동 보완] 알 수 없는 카테고리: ${categoryEng}`);
      return;
    }

    const currentCount = selectedPlacesByCategory[categoryKorean]?.length || 0;
    const shortage = Math.max(0, minCount - currentCount);
    
    console.log(`[자동 보완] ${categoryKorean} (${categoryEng}) 카테고리: 현재 ${currentCount}개, 최소 ${minCount}개, 부족 ${shortage}개`);

    if (shortage > 0) {
      // Get recommended places for this category
      const availableRecommended = recommendedPlacesByCategory[categoryKorean] || [];
      
      if (availableRecommended.length > 0) {
        console.log(`[자동 보완] ${categoryKorean} 카테고리 추천 후보:`, 
          availableRecommended.length > 0 
            ? availableRecommended.slice(0, 5).map(p => ({name: p.name, id: p.id})) + 
              `${availableRecommended.length > 5 ? ' 외 ' + (availableRecommended.length - 5) + '개' : ''}`
            : '없음'
        );
      }

      const candidatesToAdd = availableRecommended
        .filter(rp => 
          // Check that it's not already selected
          !selectedPlaces.some(sp => sp.id === rp.id) && 
          // Check that it's not already added as a candidate in this run
          !addedCandidatePlaces.some(acp => acp.id === rp.id)
        )
        .slice(0, shortage);
        
      if (candidatesToAdd.length > 0) {
        console.log(`[자동 보완] ${categoryKorean} 카테고리에 ${candidatesToAdd.length}개 장소 자동 추가:`, 
          candidatesToAdd.map(p => p.name));
        
        const markedCandidates = candidatesToAdd.map(p => ({
          ...p,
          isCandidate: true // Mark as an auto-selected candidate
        }));
        
        finalPlaces.push(...markedCandidates);
        addedCandidatePlaces.push(...markedCandidates);
      } else {
        console.warn(`[자동 보완] ${categoryKorean} 카테고리의 추천 장소가 부족하거나 이미 선택된 장소입니다. (부족분: ${shortage}, 사용가능 추천: ${availableRecommended.length})`);
        
        // TODO: Implement fallback strategies here
        // 1. Expand to nearby regions
        // 2. Include less relevant places
      }
    }
  });
  
  // Log final results
  if (addedCandidatePlaces.length > 0) {
    console.log(`[자동 보완 완료] 총 ${addedCandidatePlaces.length}개의 장소를 자동으로 추가했습니다.`, 
      addedCandidatePlaces.map(p => `${p.name} (${getCategoryKorean(p.category)})`));
  } else {
    console.log('[자동 보완] 추가된 자동 추천 장소가 없습니다.');
  }
  
  return { 
    finalPlaces,
    addedPlaces: addedCandidatePlaces
  };
};

/**
 * Convert English category to Korean display name
 */
export const getCategoryKorean = (category?: string): string => {
  if (!category) return '기타';
  
  switch (category.toLowerCase()) {
    case 'accommodation': return '숙소';
    case 'attraction': return '관광지';
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    default: return '기타';
  }
};
