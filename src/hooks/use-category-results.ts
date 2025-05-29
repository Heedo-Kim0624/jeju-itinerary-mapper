import { useQuery } from '@tanstack/react-query';
import { fetchWeightedResults } from '@/lib/travelFilter';
import { CategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';

// 지역명 표준화 함수 - UI 지역명을 DB location 필드와 일치하도록 변환
const normalizeRegionName = (region: string): string => {
  // 지역명 매핑 테이블 - UI 지역명을 DB location 필드명으로 변환
  const regionMapping: Record<string, string> = {
    '제주시내': '제주',
    '서귀포시내': '서귀포',
    // 아래 지역들은 DB와 UI가 동일하므로 변환 불필요
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
  category: CategoryName | null,
  keywords: string[],
  regions: string[]
) => {
  // 지역명 표준화 적용
  const normalizedRegions = normalizeRegions(regions);
  
  console.log(`[useCategoryResults] Category: ${category}, Keywords: ${keywords.join(', ')}, Regions: ${regions.join(', ')}`);
  console.log(`[useCategoryResults] Normalized Regions: ${normalizedRegions.join(', ')}`);

  return useQuery({
    queryKey: ['categoryResults', category, keywords, normalizedRegions],
    queryFn: async () => {
      if (!category) {
        return { recommendedPlaces: [], normalPlaces: [] };
      }

      try {
        // 표준화된 지역명으로 데이터 요청
        const results = await fetchWeightedResults(
          category.toLowerCase() as any,
          normalizedRegions,
          keywords
        );

        console.log(`[useCategoryResults] Fetched ${results.length} results for ${category}`);

        // 결과가 없을 경우 디버깅 로그 추가
        if (results.length === 0) {
          console.warn(`[useCategoryResults] No results found for category: ${category}, regions: ${normalizedRegions.join(', ')}, keywords: ${keywords.join(', ')}`);
          
          // 지역 필터 없이 재시도 (디버깅 목적)
          console.log('[useCategoryResults] Attempting to fetch without region filter for debugging');
          const allResults = await fetchWeightedResults(
            category.toLowerCase() as any,
            [],
            keywords
          );
          console.log(`[useCategoryResults] Without region filter: found ${allResults.length} results`);
          
          // 사용자에게 알림
          if (regions.length > 0) {
            toast.info(`선택한 지역(${regions.join(', ')})에 해당하는 장소를 찾을 수 없습니다.`);
          }
        }

        // 추천 장소와 일반 장소로 구분 (임시 로직, 실제 구현에 맞게 수정 필요)
        const recommendedPlaces = results.filter(place => place.rating && place.rating >= 4.0);
        const normalPlaces = results.filter(place => !place.rating || place.rating < 4.0);

        return {
          recommendedPlaces,
          normalPlaces
        };
      } catch (error) {
        console.error('[useCategoryResults] Error fetching category results:', error);
        toast.error('장소 정보를 불러오는 중 오류가 발생했습니다.');
        return { recommendedPlaces: [], normalPlaces: [] };
      }
    },
    enabled: !!category && keywords.length > 0,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });
};
