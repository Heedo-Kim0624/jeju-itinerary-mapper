
import { useState } from 'react';
import { Place } from '@/types/supabase';
import { getMinimumRecommendationCount } from '@/lib/itinerary/itinerary-utils';
import { CategoryName, getCategoryKorean } from '@/utils/categoryUtils';
import { toast } from 'sonner';

/**
 * Hook for auto-completing place selections with recommended places
 */
export const useAutoComplete = () => {
  /**
   * Automatically completes place selections with recommended places
   */
  const autoCompleteWithCandidates = (
    currentSelectedPlaces: Place[], 
    recommendedPlacesByCategory: Record<CategoryName, Place[]>, 
    currentTripDuration: number
  ): Place[] => {
    console.log("[자동 보완] autoCompleteWithCandidates 함수 호출됨", {
      여행일수: currentTripDuration,
      선택된_장소_수: currentSelectedPlaces.length,
      추천_카테고리_목록: Object.keys(recommendedPlacesByCategory)
    });
    
    // Log available recommended places for each category
    Object.entries(recommendedPlacesByCategory).forEach(([category, places]) => {
      console.log(`[자동 보완] ${category} 카테고리 추천 후보 장소: ${places?.length || 0}개`);
      if (places && places.length > 0) {
        console.log(`[자동 보완] 샘플 추천 장소:`, 
          places.slice(0, 2).map(p => ({id: p.id, name: p.name, weight: p.weight}))
        );
      }
    });

    if (!currentTripDuration || currentTripDuration < 1) {
      console.warn('[자동 보완] 여행 기간 정보가 없어 후보 장소를 자동 보완할 수 없습니다.');
      return currentSelectedPlaces;
    }
    
    const minimumRequirements = getMinimumRecommendationCount(currentTripDuration);
    console.log('[자동 보완] 카테고리별 최소 필요 장소 수:', minimumRequirements);
    
    const categoryEngToKorMapping: Record<string, CategoryName> = {
      'attraction': '관광지',
      'restaurant': '음식점',
      'cafe': '카페',
      'accommodation': '숙소',
      'touristSpot': '관광지' // Alternative mapping
    };
    const categoryKorToEngMapping: Record<CategoryName, string> = {
      '관광지': 'attraction',
      '음식점': 'restaurant',
      '카페': 'cafe',
      '숙소': 'accommodation',
      '기타': 'other'
    };

    const currentSelectedCountsByKoreanCategory: Record<CategoryName, Place[]> = {
      '숙소': [], '관광지': [], '음식점': [], '카페': [], '기타': []
    };
    
    // Group selected places by category
    currentSelectedPlaces.forEach(place => {
      const koreanCategory = getCategoryKorean(place.category);
      currentSelectedCountsByKoreanCategory[koreanCategory].push(place);
    });
    
    console.log('[자동 보완] 현재 카테고리별 선택된 장소:', {
      숙소: currentSelectedCountsByKoreanCategory['숙소'].length,
      관광지: currentSelectedCountsByKoreanCategory['관광지'].length,
      음식점: currentSelectedCountsByKoreanCategory['음식점'].length,
      카페: currentSelectedCountsByKoreanCategory['카페'].length,
      총장소수: currentSelectedPlaces.length
    });
    
    const finalPlaces: Place[] = [...currentSelectedPlaces];
    const autoCompletedCandidatePlaces: Place[] = [];
    
    // For each category, check if we need to add more places
    Object.entries(minimumRequirements).forEach(([categoryEng, minCount]) => {
      // Convert to Korean category name for our local mappings
      const categoryKorean = categoryEngToKorMapping[categoryEng];
      if (!categoryKorean) {
        console.warn(`[자동 보완] 알 수 없는 카테고리: ${categoryEng}`);
        return;
      }

      const currentCount = currentSelectedCountsByKoreanCategory[categoryKorean]?.length || 0;
      const shortage = Math.max(0, minCount - currentCount);
      
      console.log(`[자동 보완] ${categoryKorean} (${categoryEng}) 카테고리: 현재 ${currentCount}개, 최소 ${minCount}개, 부족 ${shortage}개`);

      if (shortage > 0) {
        // Get recommended places for this category
        const availableRecommended = recommendedPlacesByCategory[categoryKorean] || [];
        
        console.log(`[자동 보완] ${categoryKorean} 카테고리 추천 후보 풀:`, 
          availableRecommended.length > 0 
            ? availableRecommended.slice(0, 3).map(p => ({name: p.name, id: p.id, weight: p.weight})) 
            : '없음'
        );

        // Filter out already selected places
        const candidatesToAdd = availableRecommended
          .filter(rp => 
            !currentSelectedPlaces.some(sp => sp.id === rp.id) && 
            !autoCompletedCandidatePlaces.some(acp => acp.id === rp.id)
          )
          .slice(0, shortage);
          
        if (candidatesToAdd.length > 0) {
          console.log(`[자동 보완] ${categoryKorean} 카테고리에 ${candidatesToAdd.length}개 장소 자동 추가:`, 
            candidatesToAdd.map(p => p.name));
          
          // Mark these places as candidates
          const markedCandidates = candidatesToAdd.map(p => ({
            ...p,
            isCandidate: true 
          }));
          
          finalPlaces.push(...markedCandidates);
          autoCompletedCandidatePlaces.push(...markedCandidates);
        } else {
          console.warn(`[자동 보완] ${categoryKorean} 카테고리의 추천 장소가 부족하거나 이미 선택된 장소입니다.`);
          
          // Try alternative strategy: use any places from the category that have non-zero weights
          if (availableRecommended.length === 0) {
            console.log(`[자동 보완] ${categoryKorean} 카테고리에 대한 대체 추천 전략 적용 중...`);
            // Implementation for fallback strategy can be added here if needed
          }
        }
      }
    });
    
    // Display summary of auto-completion
    if (autoCompletedCandidatePlaces.length > 0) {
      console.log(`[자동 보완 완료] 총 ${autoCompletedCandidatePlaces.length}개의 장소를 자동으로 추가했습니다.`, 
        autoCompletedCandidatePlaces.map(p => `${p.name} (${getCategoryKorean(p.category)})`));
        
      // Notify the user
      toast.info(`${autoCompletedCandidatePlaces.length}개의 추천 장소가 자동으로 추가되었습니다.`);
    } else {
      console.log('[자동 보완] 추가된 자동 추천 장소가 없습니다.');
    }
    
    return finalPlaces;
  };

  return {
    autoCompleteWithCandidates
  };
};
