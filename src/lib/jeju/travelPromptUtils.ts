
import { supabase } from '@/integrations/supabase/client';
import { Place } from '@/types/supabase';
import { toast } from '@/hooks/use-toast';

// Place result type from the database query
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

// 프롬프트 파싱 결과 타입
export interface ParsedPrompt {
  schedule: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
  locations: string[];
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
  rankedKeywords: string[];    // 1,2,3순위
  unrankedKeywords: string[];  // 순위 없는 키워드
}

// 지역 매핑
const locationMapping: Record<string,string> = {
  '서귀포시내': '서귀포',
  '제주시내': '제주'
};

// Place 변환 유틸리티 함수
export function convertToPlace(result: PlaceResult): Place {
  return {
    id: result.id,
    name: result.place_name,
    address: result.road_address,
    category: result.category,
    x: result.x,
    y: result.y,
    naverLink: '', // 기본값
    instaLink: '', // 기본값
    rating: result.rating,
    reviewCount: result.visitor_review_count,
  };
}

// 프롬프트 파싱 함수
export const parsePrompt = (input: string): ParsedPrompt | null => {
  try {
    // 1. 일정 추출
    const scheduleMatch = input.match(/일정\[([\d\.]+),([\d:]+),([\d\.]+),([\d:]+)\]/);
    if (!scheduleMatch) throw new Error('일정 형식 오류');
    
    // 2. 지역 추출
    const locationsMatch = input.match(/지역\[(.*?)\]/);
    if (!locationsMatch) throw new Error('지역 형식 오류');
    const locations = locationsMatch[1].split(',').map(s => s.trim());
    
    // 3. 카테고리 및 키워드 추출
    const categoryMap: Record<string, 'accommodation' | 'landmark' | 'restaurant' | 'cafe'> = {
      '숙소': 'accommodation',
      '관광지': 'landmark',
      '음식점': 'restaurant',
      '카페': 'cafe'
    };
    
    let category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe' | null = null;
    let rankedKeywords: string[] = [];
    let unrankedKeywords: string[] = [];
    
    // 단일 카테고리 키워드 추출
    for (const [kor, eng] of Object.entries(categoryMap)) {
      // 예: 숙소[{a,b,c},d,e]
      const regex = new RegExp(`${kor}\\[\\{([^\\}]+)\\}(?:,([^\\]]+))?\\]`);
      const match = input.match(regex);
      if (match) {
        category = eng;
        rankedKeywords = match[1].split(',').map(s => s.trim());
        if (match[2]) unrankedKeywords = match[2].split(',').map(s => s.trim());
        break;
      }
    }
    
    if (!category) throw new Error('카테고리 형식 오류');
    
    return {
      schedule: {
        startDate: scheduleMatch[1],
        startTime: scheduleMatch[2],
        endDate: scheduleMatch[3],
        endTime: scheduleMatch[4]
      },
      locations,
      category,
      rankedKeywords,
      unrankedKeywords
    };
  } catch (e) {
    console.error('프롬프트 파싱 오류:', e);
    toast({
      title: "프롬프트 파싱 오류",
      description: (e as Error).message,
      variant: "destructive"
    });
    return null;
  }
};

// 키워드→컬럼 매핑
async function mapKeywordToColumn(
  keyword: string,
  category: PlaceResult['category']
): Promise<string|null> {
  try {
    const { data, error } = await supabase
      .from('similarity_matching')
      .select('field_name')
      .eq('user_keyword', keyword)
      .eq('table_name', category)
      .single();
      
    if (error) {
      console.error(`[mapKeywordToColumn] error mapping "${keyword}" →`, error);
      return null;
    }
    
    console.log(`[mapKeywordToColumn] "${keyword}" →`, data?.field_name);
    return data?.field_name || null;
  } catch (err) {
    console.error(`[mapKeywordToColumn] exception:`, err);
    return null;
  }
}

// 가중치 평가 + 결과 fetch
export async function fetchWeightedResults(
  category: PlaceResult['category'],
  locations: string[],
  keywords: string[]
): Promise<PlaceResult[]> {
  console.log('--- fetchWeightedResults 시작 ---');
  console.log('category:', category);
  console.log('locations:', locations);
  console.log('keywords:', keywords);

  // 1) 지역 필터링
  const mappedLocs = locations.map(l => locationMapping[l] || l);
  console.log('[1] 매핑된 지역 locations →', mappedLocs);

  // 테이블 이름 수정 (Supabase 스키마에 맞게)
  const locationTable = `${category}_information`;
  
  try {
    const { data: locIds, error: locErr } = await supabase
      .from(locationTable)
      .select('id')
      .in('location', mappedLocs);
      
    if (locErr) {
      console.error('[1] 지역 필터링 오류:', locErr);
      return [];
    }
    
    console.log('[1] 필터링된 ID 목록 개수 →', locIds?.length);
    if (!locIds?.length) return [];

    // 2) 키워드 컬럼 매핑
    const kwCols = await Promise.all(
      keywords.map((kw, i) =>
        mapKeywordToColumn(kw, category)
          .then(c => ({ keyword: kw, col: c, idx: i }))
      )
    );
    
    console.log('[2] 키워드→컬럼 매핑 결과 →', kwCols);
    const valid = kwCols.filter(k => k.col);
    console.log('[2] 유효한 컬럼만 →', valid);

    if (!valid.length) return [];

    // 3) 가중치 계산
    const weights: Record<string, number> = {};
    const base = [0.4, 0.3, 0.2];
    valid.forEach(({ col, idx }) => {
      if (col) {
        weights[col] = idx < 3 ? base[idx] : 0;
      }
    });
    
    const used = Object.values(weights).reduce((a, b) => a + b, 0);
    const remain = Math.max(0, 1 - used);
    const unranked = valid.filter(k => k.idx >= 3);
    
    unranked.forEach(k => {
      if (k.col) {
        weights[k.col] = remain / unranked.length;
      }
    });
    
    console.log('[3] 최종 가중치(weights) →', weights);

    // 4) 각 장소 점수 계산
    const scores: Record<string, number> = {};
    
    for (const item of locIds) {
      if (!item || !item.id) continue;
      
      const cols = valid.map(k => k.col).join(',');
      const reviewTable = `${category}_review`;
      
      try {
        const { data: rv, error: rvErr } = await supabase
          .from(reviewTable)
          .select(`id,review_norm,${cols}`)
          .eq('id', item.id)
          .single();
          
        if (rvErr) {
          console.warn(`[4] review 조회 오류 (id=${item.id}):`, rvErr);
          continue;
        }
        
        if (!rv) continue;
        
        let s = Object.entries(weights)
          .reduce((sum, [c, w]) => sum + (rv[c] || 0) * w, 0);
          
        s *= rv.review_norm || 1;
        scores[item.id] = s;
      } catch (err) {
        console.error(`[4] 점수 계산 오류 (id=${item.id}):`, err);
      }
    }
    
    console.log('[4] 계산된 점수(scores) →', scores);

    // 5) 상위 20개 id
    const top = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => id);
      
    console.log('[5] 상위 20개 id →', top);

    if (!top.length) return [];

    // 6) 최종 조회
    const infoTable = `${category}_information`;
    const ratingTable = `${category}_rating`;
    
    const { data: info, error: infoErr } = await supabase
      .from(infoTable)
      .select(`id,place_name,road_address,x,y,${ratingTable}(rating,visitor_review_count)`)
      .in('id', top);
      
    if (infoErr) {
      console.error('[6] 최종 정보 조회 오류:', infoErr);
      return [];
    }
    
    console.log('[6] 최종 조회된 장소 개수 →', info?.length);

    const results = info.map(i => ({
      id: i.id,
      place_name: i.place_name,
      road_address: i.road_address,
      x: i.x || 0,
      y: i.y || 0,
      rating: i[ratingTable]?.rating || 0,
      visitor_review_count: i[ratingTable]?.visitor_review_count || 0,
      category
    }));
    
    console.log('--- fetchWeightedResults 종료 → 결과 배열 →', results);
    return results;
  } catch (err) {
    console.error('fetchWeightedResults 전체 오류:', err);
    return [];
  }
}
