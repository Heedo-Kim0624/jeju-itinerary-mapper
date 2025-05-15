
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { fetchRecommendedPlaces } from '@/services/recommendationService';
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

  // Cache for recommended places by category
  const [recommendedPlacesByCategory, setRecommendedPlacesByCategory] = useState<Record<string, Place[]>>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
  });

  const fetchCategoryData = async () => {
    if (!category) {
      console.log('[useCategoryResults] 카테고리가 지정되지 않았습니다.');
      return;
    }

    // Skip if we don't have both keywords and regions
    if (!keywords.length || !regions.length) {
      console.log('[useCategoryResults] 키워드 또는 지역이 선택되지 않았습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[useCategoryResults] 카테고리 '${category}' 데이터 가져오기, 키워드: ${keywords.join(', ')}, 지역: ${regions.join(', ')}`);

      // Fetch recommended places from our new service
      const results = await fetchRecommendedPlaces(category, regions, keywords);
      console.log(`[useCategoryResults] 가져온 장소 수: ${results.length}`);

      if (results.length === 0) {
        console.warn(`[useCategoryResults] ${category} 카테고리에 대한 추천 장소를 찾을 수 없습니다.`);
        toast.warning(`선택한 키워드와 지역에 맞는 ${category}를 찾을 수 없습니다. 다른 키워드를 시도해보세요.`);
      } else {
        // Top 20% are recommended places, rest are normal places
        const cutoff = Math.max(1, Math.ceil(results.length * 0.2));
        const recommended = results.slice(0, cutoff);
        const normal = results.slice(cutoff);
        
        setRecommendedPlaces(recommended);
        setNormalPlaces(normal);
        
        // Update cache
        setRecommendedPlacesByCategory(prev => ({
          ...prev,
          [category]: recommended
        }));
        
        console.log(`[useCategoryResults] 추천 장소: ${recommended.length}개, 일반 장소: ${normal.length}개`);
      }
    } catch (err) {
      console.error('[useCategoryResults] 장소 데이터 로드 중 오류 발생:', err);
      setError(err instanceof Error ? err.message : '장소 데이터를 가져오지 못했습니다.');
      toast.error(`${category} 데이터를 불러오는 데 실패했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced data fetching when inputs change
  useDebounceEffect(() => {
    fetchCategoryData();
  }, [category, keywords.join(','), regions.join(',')], 500);

  return {
    isLoading,
    error,
    recommendedPlaces,
    normalPlaces,
    recommendedPlacesByCategory,
    refetch: fetchCategoryData
  };
};
