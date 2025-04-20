
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
  rankedKeywords: string[],
  unrankedKeywords: string[] = []
): Promise<PlaceResult[]> {
  try {
    console.log('Fetching weighted results:', { category, locations, rankedKeywords, unrankedKeywords });
    
    // 1. 지역 매핑 처리
    const mappedLocations = locations.map(loc => locationMapping[loc] || loc);
    
    // 2. 키워드 매핑 및 가중치 할당
    const rankedWeights = [0.4, 0.3, 0.2];
    const remainingWeight = 1 - rankedWeights.slice(0, rankedKeywords.length).reduce((a, b) => a + b, 0);
    const unrankedWeight = unrankedKeywords.length > 0 ? remainingWeight / unrankedKeywords.length : 0;

    // Combine ranked and unranked keywords with their weights
    const keywordPromises = [
      ...rankedKeywords.map((kw, i) => 
        mapKeywordToColumn(kw, category).then(column => ({
          column,
          weight: rankedWeights[i] || 0
        }))
      ),
      ...unrankedKeywords.map(kw =>
        mapKeywordToColumn(kw, category).then(column => ({
          column,
          weight: unrankedWeight
        }))
      )
    ];

    const keywordColumns = await Promise.all(keywordPromises);
    const validKeywordColumns = keywordColumns.filter(k => k.column !== null) as { column: string; weight: number }[];

    if (validKeywordColumns.length === 0) {
      console.warn("No valid keywords found for mapping");
      return [];
    }

    // 개발용 모의 데이터 반환 (실제 구현 시 제거)
    const results = Array.from({ length: 20 }, (_, idx) => ({
      id: `${category}-${idx+1}`,
      place_name: `${category === 'accommodation' ? '숙소' : 
                   category === 'landmark' ? '관광지' : 
                   category === 'restaurant' ? '음식점' : '카페'} ${idx+1}`,
      road_address: `${mappedLocations[0] || '제주'} ${idx+1}번지`,
      rating: Math.round((4 + Math.random()) * 10) / 10,
      visitor_review_count: Math.floor(Math.random() * 500) + 50,
      category,
      x: 126.5 + (Math.random() * 0.3 - 0.15),
      y: 33.4 + (Math.random() * 0.3 - 0.15),
    }));

    return results.sort((a, b) => {
      const idx = results.indexOf(a);
      if (idx < 4) return b.rating - a.rating;
      return b.rating - a.rating + (Math.random() * 0.5 - 0.25);
    });
  } catch (error) {
    console.error('Weighted results fetch error:', error);
    return [];
  }
}

// 프롬프트 파싱
interface ParsedPrompt {
  schedule: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  };
  locations: string[];
  category: 'accommodation' | 'landmark' | 'restaurant' | 'cafe';
  rankedKeywords: string[];
  unrankedKeywords: string[];
}

export function parsePrompt(prompt: string): ParsedPrompt | null {
  try {
    const result: ParsedPrompt = {
      schedule: { startDate: '', startTime: '', endDate: '', endTime: '' },
      locations: [],
      category: 'accommodation',
      rankedKeywords: [],
      unrankedKeywords: []
    };

    // Parse schedule [MM.dd,HH:mm,MM.dd,HH:mm]
    const scheduleMatch = prompt.match(/일정\[([\d.,: ]+)\]/);
    if (scheduleMatch) {
      const [startDate, startTime, endDate, endTime] = scheduleMatch[1].split(',');
      result.schedule = { startDate, startTime, endDate, endTime };
    }

    // Parse locations [loc1,loc2,...]
    const locationMatch = prompt.match(/지역\[([^\]]+)\]/);
    if (locationMatch) {
      result.locations = locationMatch[1].split(',').map(loc => loc.trim());
    }

    // Parse category and keywords
    const categoryMatch = prompt.match(/(숙소|관광지|음식점|카페)\[{([^}]+)},([^\]]*)\]/);
    if (categoryMatch) {
      result.category = categoryMatch[1] === '숙소' ? 'accommodation' :
                       categoryMatch[1] === '관광지' ? 'landmark' :
                       categoryMatch[1] === '음식점' ? 'restaurant' : 'cafe';
      
      result.rankedKeywords = categoryMatch[2].split(',').map(k => k.trim());
      result.unrankedKeywords = categoryMatch[3].split(',').map(k => k.trim()).filter(k => k);
    }

    return result;
  } catch (error) {
    console.error('프롬프트 파싱 오류:', error);
    return null;
  }
}
