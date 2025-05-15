
import { useState } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
// import axios from 'axios'; // 현재 사용되지 않음
import { fetchAccommodations } from '@/services/accommodations/accommodationService';
import { fetchLandmarks } from '@/services/landmarks/landmarkService';
import { fetchRestaurants } from '@/services/restaurants/restaurantService';
import { fetchCafes } from '@/services/cafes/cafeService';
import { useDebounceEffect } from './use-debounce-effect';
import type { CategoryName } from '@/utils/categoryUtils'; // CategoryName 임포트

// 카테고리별 최소 추천 장소 수 (조정 가능)
const MIN_RECOMMENDED_PLACES_PER_CATEGORY = 10; 
// 추천 장소로 분류하기 위한 최소 가중치 (키워드 매칭 없을 때)
const BASE_RECOMMENDATION_WEIGHT_THRESHOLD = 0.1; // 예시 값, 장소 데이터의 기본 weight 분포에 따라 조정

export const useCategoryResults = (
  category: CategoryName | null, // 타입을 CategoryName | null 로 명시
  keywords: string[],
  regions: string[] = []
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [normalPlaces, setNormalPlaces] = useState<Place[]>([]);

  const filterByRegion = (places: Place[], selectedRegions: string[]): Place[] => {
    if (!selectedRegions || selectedRegions.length === 0) return places;
    return places.filter(place => place.address && selectedRegions.some(region => place.address.includes(region)));
  };

  const calculateKeywordScore = (place: Place, currentKeywords: string[]): number => {
    let score = place.weight || 0; // 장소 자체의 기본 가중치
    
    if (currentKeywords && currentKeywords.length > 0) {
      const keywordBonus = currentKeywords.reduce((bonus, keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        if (place.name.toLowerCase().includes(lowerKeyword)) bonus += 3;
        if (place.categoryDetail?.toLowerCase().includes(lowerKeyword)) bonus += 2;
        if (place.address.toLowerCase().includes(lowerKeyword)) bonus += 1;
        // 태그나 설명 필드가 있다면 추가 검색 대상
        // if (place.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))) bonus += 2;
        // if (place.description?.toLowerCase().includes(lowerKeyword)) bonus += 1;
        return bonus;
      }, 0);
      score += Math.min(5, keywordBonus); // 키워드 보너스는 최대 5점
    }
    return score;
  };

  const fetchCategoryData = async () => {
    if (!category) {
      setRecommendedPlaces([]);
      setNormalPlaces([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useCategoryResults] 카테고리 '${category}' 데이터 가져오기 시작. 키워드: [${keywords.join(', ')}], 지역: [${regions.join(', ')}]`);
      let data: Place[] = [];
      switch (category) {
        case '숙소': data = await fetchAccommodations(); break;
        case '관광지': data = await fetchLandmarks(); break;
        case '음식점': data = await fetchRestaurants(); break;
        case '카페': data = await fetchCafes(); break;
        default: throw new Error(`지원하지 않는 카테고리: ${category}`);
      }
      console.log(`[useCategoryResults] '${category}' 원본 데이터 ${data.length}개 로드됨.`);

      let processedData = filterByRegion(data, regions);
      console.log(`[useCategoryResults] 지역 필터링 후 ${processedData.length}개.`);

      processedData = processedData.map(place => ({
        ...place,
        // category 필드가 없는 경우를 대비하여 기본값 설정
        category: place.category || category, // API 응답에 category 필드가 없다면 여기서 채워줌
        weight: calculateKeywordScore(place, keywords) // 계산된 가중치 할당
      }));
      
      console.log(`[useCategoryResults] 키워드 점수 계산 후 샘플 (상위 3개 가중치):`, 
        processedData.sort((a,b) => (b.weight || 0) - (a.weight || 0)).slice(0,3).map(p => ({name: p.name, weight: p.weight}))
      );

      // 가중치 기준으로 내림차순 정렬
      const sortedData = [...processedData].sort((a, b) => (b.weight || 0) - (a.weight || 0));

      // 추천 장소와 일반 장소 분류 로직 개선
      let recPlaces: Place[] = [];
      let normPlaces: Place[] = [];

      if (keywords.length > 0) {
        // 키워드가 있을 경우: 가중치가 높은 상위 N개 또는 일정 비율을 추천
        // 예: 상위 20% 또는 최소 MIN_RECOMMENDED_PLACES_PER_CATEGORY 개수 중 더 큰 값
        const cutoffPercentage = Math.floor(sortedData.length * 0.25); // 25%로 늘림
        const numToRecommend = Math.max(MIN_RECOMMENDED_PLACES_PER_CATEGORY, cutoffPercentage);
        
        recPlaces = sortedData.slice(0, numToRecommend);
        normPlaces = sortedData.slice(numToRecommend);
      } else {
        // 키워드가 없을 경우: 기본 가중치가 특정 값 이상인 장소들을 추천하거나, 상위 N개 추천
        recPlaces = sortedData.filter(p => (p.weight || 0) >= BASE_RECOMMENDATION_WEIGHT_THRESHOLD).slice(0, MIN_RECOMMENDED_PLACES_PER_CATEGORY * 2); // 키워드 없을땐 더 많이 후보로
        // 나머지를 일반 장소로 (recPlaces에 이미 포함된 것은 제외)
        const recPlaceIds = new Set(recPlaces.map(p => p.id));
        normPlaces = sortedData.filter(p => !recPlaceIds.has(p.id));
      }
      
      // 만약 추천 장소가 너무 적으면 일반 장소에서 일부 끌어오기 (단, 너무 많아지지 않도록)
      if (recPlaces.length < MIN_RECOMMENDED_PLACES_PER_CATEGORY && normPlaces.length > 0) {
          const needed = MIN_RECOMMENDED_PLACES_PER_CATEGORY - recPlaces.length;
          recPlaces.push(...normPlaces.slice(0, needed));
          normPlaces = normPlaces.slice(needed);
      }


      console.log(`[useCategoryResults] '${category}' 최종 결과 - 추천: ${recPlaces.length}개, 일반: ${normPlaces.length}개.`);
      if(recPlaces.length > 0) {
        console.log(`[useCategoryResults] 샘플 추천 장소 (최대 3개):`, 
          recPlaces.slice(0, 3).map(p => ({ name: p.name, weight: p.weight, category: p.category }))
        );
      } else {
        console.warn(`[useCategoryResults] '${category}'에 대한 추천 장소를 찾지 못했습니다.`);
      }


      setRecommendedPlaces(recPlaces);
      setNormalPlaces(normPlaces);

    } catch (err) {
      console.error(`'${category}' 데이터 로드 중 오류:`, err);
      setError(err instanceof Error ? err.message : '장소 데이터를 가져오지 못했습니다.');
      toast.error(`${category} 데이터를 불러오는 데 실패했습니다.`);
      setRecommendedPlaces([]);
      setNormalPlaces([]);
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
