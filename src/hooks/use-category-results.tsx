
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import axios from 'axios';
import { fetchAccommodations } from '@/services/accommodations/accommodationService';
import { fetchLandmarks } from '@/services/landmarks/landmarkService';
import { fetchRestaurants } from '@/services/restaurants/restaurantService';
import { fetchCafes } from '@/services/cafes/cafeService';
import { useDebounceEffect } from './use-debounce-effect';

export const useCategoryResults = (
  category: '숙소' | '관광지' | '음식점' | '카페' | null,
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

  const fetchCategoryData = async () => {
    if (!category || keywords.length === 0) {
      console.log("카테고리 또는 키워드가 없어 데이터를 가져오지 않습니다.");
      setRecommendedPlaces([]);
      setNormalPlaces([]);
      setError(null);
      return;
    }

    console.log(`[useCategoryResults] 데이터 가져오기 시작: 카테고리=${category}, 키워드=${keywords.join(', ')}, 지역=${regions.join(', ')}`);
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[useCategoryResults] 카테고리 '${category}' 데이터 가져오기, 키워드: ${keywords.join(', ')}, 지역: ${regions.join(', ')}`);

      let data: Place[] = [];
      
      // 카테고리에 따라 적절한 서비스 함수 호출
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
          throw new Error('지원하지 않는 카테고리입니다.');
      }

      console.log(`[useCategoryResults] 초기 데이터 로드됨: ${data.length}개 항목`);

      // 지역으로 필터링
      const filteredByRegion = filterByRegion(data, regions);
      console.log(`[useCategoryResults] 지역 필터링 후: ${filteredByRegion.length}개 항목`);
      
      if (filteredByRegion.length === 0) {
        console.log("[useCategoryResults] 필터링 후 결과가 없습니다.");
        setRecommendedPlaces([]);
        setNormalPlaces([]);
        return;
      }

      // weight 기준으로 정렬
      const sortedData = [...filteredByRegion].sort((a, b) => {
        const weightA = a.weight || 0;
        const weightB = b.weight || 0;
        return weightB - weightA;
      });

      // 상위 20%는 추천 장소로, 나머지는 일반 장소로 분류
      const cutoff = Math.max(1, Math.floor(sortedData.length * 0.2));
      setRecommendedPlaces(sortedData.slice(0, cutoff));
      setNormalPlaces(sortedData.slice(cutoff));
      
      console.log(`[useCategoryResults] 추천 장소: ${cutoff}개, 일반 장소: ${sortedData.length - cutoff}개`);

    } catch (err) {
      console.error('장소 데이터 로드 중 오류 발생:', err);
      setError(err instanceof Error ? err.message : '장소 데이터를 가져오지 못했습니다.');
      toast.error(`${category} 데이터를 불러오는 데 실패했습니다.`);
      setRecommendedPlaces([]);
      setNormalPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스 효과로 검색 요청 최적화
  useEffect(() => {
    if (category && keywords.length > 0) {
      console.log(`[useCategoryResults] 즉시 데이터 요청: ${category}, 키워드 수: ${keywords.length}`);
      fetchCategoryData();
    }
  }, [category, JSON.stringify(keywords), JSON.stringify(regions)]);

  return {
    isLoading,
    error,
    recommendedPlaces,
    normalPlaces,
    refetch: fetchCategoryData
  };
};
