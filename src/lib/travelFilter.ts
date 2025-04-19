
import { supabase } from '@/integrations/supabase/client';

// PlaceResult 타입 정의
export interface PlaceResult {
  id: string;
  place_name: string;
  road_address: string;
  rating: number;
  visitor_review_count: number;
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
  x: number;
  y: number;
}

// 지역 매핑 규칙
const locationMapping: Record<string, string> = {
  "서귀포시내": "서귀포",
  "제주시내": "제주"
};

// 키워드 → 컬럼명 매핑 (DB 조회용)
export async function mapKeywordToColumn(
  keyword: string,
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe'
): Promise<string | null> {
  try {
    // similarity_matching 테이블 조회
    const { data, error } = await supabase
      .from('similarity_matching')
      .select('field_name')
      .eq('user_keyword', keyword)
      .eq('table_name', category)
      .single();

    if (error) throw error;
    return data?.field_name || null;
  } catch (error) {
    console.error(`키워드 매핑 오류 (${keyword}, ${category}):`, error);
    return null;
  }
}

// 가중치 기반 장소 조회
export async function fetchWeightedResults(
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe',
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  try {
    console.log(`Fetching weighted results for ${category}`, { locations, keywords });
    
    // 실제 구현 시작    
    // 1. 지역 매핑 처리
    const mappedLocations = locations.map(loc => locationMapping[loc] || loc);
    console.log("Mapped locations:", mappedLocations);
    
    // 2. 키워드를 DB 컬럼으로 매핑
    const keywordColumnPromises = keywords.map((kw, index) => 
      mapKeywordToColumn(kw, category).then(column => ({
        column, 
        weight: index === 0 ? 0.4 : index === 1 ? 0.3 : 0.2 // 가중치 부여
      }))
    );
    
    const keywordColumns = await Promise.all(keywordColumnPromises);
    const validKeywordColumns = keywordColumns.filter(k => k.column !== null) as {column: string, weight: number}[];
    
    console.log("Valid keyword columns with weights:", validKeywordColumns);
    
    if (validKeywordColumns.length === 0) {
      console.warn("No valid keywords found for mapping");
      return [];
    }
    
    // 개발 단계에서는 간소화된 모의 데이터를 반환합니다.
    // 실제 프로덕션에서는 아래 주석 처리된 코드를 사용하세요.
    
    // For demo purposes, return mock data with unique IDs and better coordinates
    return Array.from({ length: 20 }, (_, i) => ({
      id: `${category}-${i+1}`,
      place_name: `${category === 'accommodation' ? '숙소' : 
                   category === 'landmark' ? '관광지' : 
                   category === 'restaurant' ? '음식점' : '카페'} ${i+1}`,
      road_address: `${mappedLocations[0] || '제주'} ${i+1}번지`,
      rating: Math.round((4 + Math.random()) * 10) / 10, // 4.0 ~ 5.0 범위의 평점
      visitor_review_count: Math.floor(Math.random() * 500) + 50, // 50 ~ 549 범위의 리뷰 수
      category,
      // 제주도 주변 좌표 범위 (실제 지도에 적절히 분산되도록)
      x: 126.5 + (Math.random() * 0.3 - 0.15), // 제주 중심 경도 약 126.5
      y: 33.4 + (Math.random() * 0.3 - 0.15),  // 제주 중심 위도 약 33.4
    })).sort((a, b) => {
      // 상위 4개는 높은 평점 순으로, 그 이후는 약간 무작위성 있게 정렬
      if (i < 4) return b.rating - a.rating;
      return b.rating - a.rating + (Math.random() * 0.5 - 0.25);
    });
    
    /* 실제 구현 코드 (프로덕션용)
    // 3. 리뷰 테이블과 정보 테이블 이름 결정
    const reviewTable = `${category}_review`;
    const infoTable = `${category}_information`;
    const ratingTable = `${category}_rating`;
    
    // 4. 가중치 기반 점수 계산 및 상위 20개 ID 추출
    const scoreQuery = supabase.rpc('calculate_weighted_score', {
      category_param: category,
      locations_param: mappedLocations,
      keyword_columns: validKeywordColumns.map(k => k.column),
      keyword_weights: validKeywordColumns.map(k => k.weight)
    });
    
    const { data: topIds, error: scoreError } = await scoreQuery;
    
    if (scoreError) {
      console.error("Score calculation error:", scoreError);
      throw scoreError;
    }
    
    // 5. 상위 ID들에 대한 상세 정보 조회
    const { data: placeDetails, error: detailsError } = await supabase
      .from(`${infoTable}`)
      .select(`
        id,
        place_name,
        road_address,
        longitude as x,
        latitude as y,
        ${ratingTable}!inner(rating, visitor_review_count)
      `)
      .in('id', topIds.map(item => item.id))
      .order('id', { ascending: false });
    
    if (detailsError) {
      console.error("Details fetch error:", detailsError);
      throw detailsError;
    }
    
    // 6. 결과 포맷팅
    return placeDetails.map(place => ({
      id: place.id,
      place_name: place.place_name || '이름 없음',
      road_address: place.road_address || '주소 없음',
      rating: place[ratingTable]?.rating || 0,
      visitor_review_count: place[ratingTable]?.visitor_review_count || 0,
      category: category,
      x: place.x || 0,
      y: place.y || 0
    }));
    */
  } catch (error) {
    console.error(`결과 조회 오류 (${category}):`, error);
    return [];
  }
}
