
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import axios from 'axios';
import { fetchAccommodations } from '@/services/accommodations/accommodationService';
import { fetchLandmarks } from '@/services/landmarks/landmarkService';
import { fetchRestaurants } from '@/services/restaurants/restaurantService';
import { fetchCafes } from '@/services/cafes/cafeService';
import { useDebounceEffect } from './use-debounce-effect';
import type { CategoryName } from '@/utils/categoryUtils'; // CategoryName 임포트

export const useCategoryResults = (
  category: CategoryName | null, // category 타입을 CategoryName | null 로 변경
  keywords: string[],
  regions: string[] = []
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [normalPlaces, setNormalPlaces] = useState<Place[]>([]);

  // 지역 필터링 함수
  const filterByRegion = (places: Place[], selectedRegions: string[]): Place[] => {
    if (!selectedRegions || selectedRegions.length === 0) {
      return places;
    }

    return places.filter(place => {
      // 주소 필드가 없으면 포함시키지 않음
      if (!place.address) return false;
      
      // 선택된 지역 중 하나라도 주소에 포함되면 결과에 포함
      return selectedRegions.some(region => 
        place.address.includes(region)
      );
    });
  };

  // 키워드 기반 가중치 계산
  const calculateKeywordScore = (place: Place, keywords: string[]): number => {
    // 키워드 없을 시 기존 가중치 유지 또는 기본값(0) 부여
    if (!keywords || keywords.length === 0) return place.weight || 0;
    
    let score = place.weight || 0; // 기존 가중치가 있으면 사용, 없으면 0에서 시작
    
    const keywordBonus = keywords.reduce((bonus, keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      const matchesName = place.name.toLowerCase().includes(lowerKeyword);
      const matchesCategoryDetail = place.categoryDetail?.toLowerCase().includes(lowerKeyword) || false;
      const matchesAddress = place.address.toLowerCase().includes(lowerKeyword);
      
      if (matchesName) bonus += 3;
      if (matchesCategoryDetail) bonus += 2;
      if (matchesAddress) bonus += 1;
      
      return bonus;
    }, 0);
    
    const normalizedBonus = Math.min(5, keywordBonus);
    
    // 상세 로그 (필요시 주석 해제하여 디버깅)
    /*
    console.log(
      `[KeywordScore] Place: ${place.name}, ` +
      `Original Weight: ${place.weight || 0}, ` +
      `Keyword Bonus (raw): ${keywordBonus}, ` +
      `Normalized Bonus: ${normalizedBonus}, ` +
      `Final Score: ${score + normalizedBonus}`
    );
    */
    
    return score + normalizedBonus;
  };

  const fetchCategoryData = async () => {
    if (!category) {
      console.log('[useCategoryResults] 카테고리가 지정되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useCategoryResults] 카테고리 '${category}' 데이터 가져오기, 키워드: ${keywords.join(', ')}, 지역: ${regions.join(', ')}`);

      let data: Place[] = [];
      
      switch (category) {
        case '숙소':
          data = await fetchAccommodations();
          break;
        case '관광지':
          data = await fetchLandmarks();
          break;
        case '음식점':
          data = await fetchRestaurants();
          break;
        case '카페':
          data = await fetchCafes();
          break;
        default:
          const exhaustiveCheck: never = category; 
          throw new Error(`지원하지 않는 카테고리입니다: ${exhaustiveCheck}`);
      }

      data = filterByRegion(data, regions);
      
      console.log(`[useCategoryResults] ${data.length}개의 장소 로드됨. 지역 필터링 후.`);
      
      if (keywords && keywords.length > 0) {
        data = data.map(place => ({
          ...place,
          weight: calculateKeywordScore(place, keywords)
        }));
        
        // --- 로그 추가 (요청사항 1.3.1) --- 
        console.log(`[useCategoryResults] 키워드 매칭 점수 적용 완료. 샘플 변경된 장소 (최대 3개):`, 
          data.slice(0, 3).map(p => ({ 이름: p.name, 가중치: p.weight }))
        );
      }

      const sortedData = [...data].sort((a, b) => (b.weight || 0) - (a.weight || 0));

      // --- 추천/일반 장소 분류 로직 수정 (요청사항 1.3.2) --- 
      const minRecommended = 5; // 최소 추천 장소 수
      const recommendedRatio = 0.3; // 추천 비율 (상위 30%)
      let cutoff = 0;

      if (sortedData.length > 0) {
        if (sortedData.length < minRecommended) {
            cutoff = sortedData.length; // 데이터가 최소 추천 수보다 적으면 가능한 만큼 모두 추천
        } else {
            cutoff = Math.floor(sortedData.length * recommendedRatio);
            if (cutoff < minRecommended) {
                cutoff = minRecommended; // 최소 추천 수 보장 (데이터가 충분하고 비율계산이 최소보다 작을때)
            }
        }
      }
      // --- 로직 수정 끝 ---

      const recommendedData = sortedData.slice(0, cutoff);
      const normalData = sortedData.slice(cutoff);
      
      // --- 로그 추가 (요청사항 1.3.3) ---
      console.log(`[useCategoryResults] 추천 장소: ${recommendedData.length}개, 일반 장소: ${normalData.length}개`);
      console.log(`[useCategoryResults] 샘플 추천 장소 (최대 3개):`, 
        recommendedData.slice(0, 3).map(p => ({ 
          이름: p.name, 
          가중치: p.weight, 
          매칭키워드: keywords.filter(k => {
            const lowerKeyword = k.toLowerCase();
            // categoryDetail이 null/undefined일 수 있으므로 안전하게 접근
            const categoryDetailMatch = p.categoryDetail ? p.categoryDetail.toLowerCase().includes(lowerKeyword) : false;
            return p.name.toLowerCase().includes(lowerKeyword) || 
                   categoryDetailMatch || 
                   p.address.toLowerCase().includes(lowerKeyword);
          }).join(', ') || "없음"
        }))
      );

      setRecommendedPlaces(recommendedData);
      setNormalPlaces(normalData);

    } catch (err) {
      console.error('장소 데이터 로드 중 오류 발생:', err);
      setError(err instanceof Error ? err.message : '장소 데이터를 가져오지 못했습니다.');
      toast.error(`${category} 데이터를 불러오는 데 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  useDebounceEffect(() => {
    fetchCategoryData();
  }, [category, keywords.join(','), regions.join(',')], 300);

  return {
    isLoading,
    error,
    recommendedPlaces,
    normalPlaces,
    refetch: fetchCategoryData
  };
};
