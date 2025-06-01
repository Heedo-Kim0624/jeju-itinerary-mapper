
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import axios from 'axios';
import { fetchAccommodations } from '@/services/accommodations/accommodationService';
import { fetchLandmarks } from '@/services/landmarks/landmarkService';
import { fetchRestaurants } from '@/services/restaurants/restaurantService';
import { fetchCafes } from '@/services/cafes/cafeService';
import { useDebounceEffect } from './use-debounce-effect';

// 지역명 표준화 함수 - UI 지역명을 DB location 필드와 일치하도록 변환
const normalizeRegionName = (region: string): string => {
  // 지역명 매핑 테이블 - UI 지역명을 DB location 필드명으로 변환
  const regionMapping: Record<string, string> = {
    '제주': '제주',
    '서귀포': '서귀포',
    '구좌': '구좌',
    '남원/표선': '남원/표선',
    '성산': '성산',
    '한경/한림': '한경/한림',
    '애월': '애월',
    '중문': '중문',
    '안덕/대정': '안덕/대정'
  };

  // 매핑 테이블에 있으면 변환된 값 반환, 없으면 원래 값 그대로 반환
  return regionMapping[region] || region;
};

// 지역 배열을 표준화하는 함수
const normalizeRegions = (regions: string[]): string[] => {
  // 빈 배열이면 빈 배열 반환 (전체 지역 검색)
  if (!regions || regions.length === 0) return [];
  
  // 각 지역명을 표준화하여 새 배열 반환
  return regions.map(normalizeRegionName);
};

export const useCategoryResults = (
  category: '숙소' | '관광지' | '음식점' | '카페' | null,
  keywords: string[],
  regions: string[] = []
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [normalPlaces, setNormalPlaces] = useState<Place[]>([]);

  // 지역명 표준화 적용
  const normalizedRegions = normalizeRegions(regions);

  // 키워드 기반 가중치 계산
  const calculateKeywordScore = (place: Place, keywords: string[]): number => {
    if (!keywords || keywords.length === 0) return 0;
    if (!place) return 0;
    
    // 기본 점수는 place.weight 또는 0
    let score = place.weight || 0;
    
    // undefined 방어 로직 추가
    const placeName = place.name || '';
    const placeCategoryDetail = place.categoryDetail || '';
    const placeAddress = place.address || '';
    
    // 키워드 매칭 점수 계산 (최대 5점)
    const keywordBonus = keywords.reduce((bonus, keyword) => {
      if (!keyword) return bonus;
      
      // 기본 검색 대상: 이름, 카테고리 상세, 주소
      const matchesName = placeName.toLowerCase().includes(keyword.toLowerCase());
      const matchesCategoryDetail = placeCategoryDetail.toLowerCase().includes(keyword.toLowerCase());
      const matchesAddress = placeAddress.toLowerCase().includes(keyword.toLowerCase());
      
      // 가중치 부여: 이름(3점), 카테고리 상세(2점), 주소(1점)
      if (matchesName) bonus += 3;
      if (matchesCategoryDetail) bonus += 2;
      if (matchesAddress) bonus += 1;
      
      return bonus;
    }, 0);
    
    // 최대 5점까지 키워드 보너스 제한
    const normalizedBonus = Math.min(5, keywordBonus);
    
    // 최종 점수 = 기존 가중치 + 키워드 보너스
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
      console.log(`[useCategoryResults] 정규화된 지역: ${normalizedRegions.join(', ')}`);

      let data: Place[] = [];
      
      // 카테고리에 따라 적절한 서비스 함수 호출 - 정규화된 지역 전달
      switch (category) {
        case '숙소':
          data = await fetchAccommodations(normalizedRegions);
          break;
        case '관광지':
          data = await fetchLandmarks(normalizedRegions);
          break;
        case '음식점':
          data = await fetchRestaurants(normalizedRegions);
          break;
        case '카페':
          data = await fetchCafes(normalizedRegions);
          break;
        default:
          throw new Error('지원하지 않는 카테고리입니다.');
      }

      // undefined 방어 로직 추가
      if (!data || !Array.isArray(data)) {
        console.warn(`[useCategoryResults] ${category} 데이터가 유효한 배열이 아닙니다:`, data);
        data = [];
      }

      console.log(`[useCategoryResults] ${data.length}개의 장소 로드됨. Supabase에서 지역 필터링 완료.`);
      
      // 결과가 없을 경우 디버깅 로그 추가
      if (data.length === 0 && normalizedRegions.length > 0) {
        console.warn(`[useCategoryResults] 지역 필터링 후 결과가 없습니다. 지역: ${normalizedRegions.join(', ')}`);
        
        // 사용자에게 알림
        if (regions.length > 0) {
          toast.info(`선택한 지역(${regions.join(', ')})에 해당하는 장소를 찾을 수 없습니다.`);
        }
      }
      const filteredKeywords = keywords.filter(k => !k.startsWith('__direct__'));
      // 키워드 매칭 점수 계산 및 할당
      if (filteredKeywords.length > 0) {
        data = data.map(place => ({
          ...place,
          weight: calculateKeywordScore(place, filteredKeywords)
        }));
        
        console.log(`[useCategoryResults] 키워드 매칭 점수 적용 완료. 키워드: ${keywords.join(', ')}`);
      }

      // weight 기준으로 정렬
      const sortedData = [...data].sort((a, b) => {
        const weightA = a.weight || 0;
        const weightB = b.weight || 0;
        return weightB - weightA;
      });

      // 상위 20%는 추천 장소로, 나머지는 일반 장소로 분류
      const cutoff = Math.max(1, Math.floor(sortedData.length * 0.2));
      const recommendedData = sortedData.slice(0, cutoff);
      const normalData = sortedData.slice(cutoff);
      
      // 결과 로깅
      console.log(`[useCategoryResults] 추천 장소: ${recommendedData.length}개, 일반 장소: ${normalData.length}개`);
      
      if (recommendedData.length > 0) {
        console.log(`[useCategoryResults] 샘플 추천 장소 (최대 3개):`, 
          recommendedData.slice(0, 3).map(p => ({ 
            이름: p.name, 
            지역: p.location,
            가중치: p.weight, 
            매칭키워드: keywords.filter(k => 
              (p.name || '').toLowerCase().includes((k || '').toLowerCase()) || 
              (p.categoryDetail || '').toLowerCase().includes((k || '').toLowerCase()) || 
              (p.address || '').toLowerCase().includes((k || '').toLowerCase())
            ) 
          }))
        );
      }

      setRecommendedPlaces(recommendedData);
      setNormalPlaces(normalData);

    } catch (err) {
      console.error('장소 데이터 로드 중 오류 발생:', err);
      setError(err instanceof Error ? err.message : '장소 데이터를 가져오지 못했습니다.');
      toast.error(`${category} 데이터를 불러오는 데 실패했습니다.`);
      
      // 오류 발생 시 빈 배열로 초기화하여 undefined 참조 방지
      setRecommendedPlaces([]);
      setNormalPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스 효과로 검색 요청 최적화
  useDebounceEffect(() => {
    fetchCategoryData();
  }, [category, keywords.join(','), normalizedRegions.join(',')], 300);

  return {
    isLoading,
    error,
    recommendedPlaces: recommendedPlaces || [], // undefined 방어
    normalPlaces: normalPlaces || [], // undefined 방어
    refetch: fetchCategoryData
  };
};
