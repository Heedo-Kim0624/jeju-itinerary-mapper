import { supabase } from '../integrations/supabase/client';

// PlaceResult 타입
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

// 지역 매핑
const locationMapping: Record<string,string> = {
  '서귀포시내':'서귀포',
  '제주시내':'제주'
};

// 키워드→컬럼 매핑
async function mapKeywordToColumn(
  keyword: string,
  category: PlaceResult['category']
): Promise<string|null> {
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
  const mappedLocs = locations.map(l => locationMapping[l]||l);
  console.log('[1] 매핑된 지역 locations →', mappedLocs);

  const { data: locIds, error: locErr } = await supabase
    .from('information')
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
    keywords.map((kw,i) =>
      mapKeywordToColumn(kw, category)
        .then(c=>({ keyword: kw, col: c, idx: i }))
    )
  );
  console.log('[2] 키워드→컬럼 매핑 결과 →', kwCols);
  const valid = kwCols.filter(k=>k.col);
  console.log('[2] 유효한 컬럼만 →', valid);

  if (!valid.length) return [];

  // 3) 가중치 계산
  const weights: Record<string,number> = {};
  const base = [0.4,0.3,0.2];
  valid.forEach(({col,idx})=>{
    weights[col!] = idx < 3 ? base[idx] : 0;
  });
  const used = Object.values(weights).reduce((a,b)=>a+b,0);
  const remain = Math.max(0,1-used);
  const unranked = valid.filter(k=>k.idx>=3);
  unranked.forEach(k=>{
    weights[k.col!] = remain / unranked.length;
  });
  console.log('[3] 최종 가중치(weights) →', weights);

  // 4) 각 장소 점수 계산
  const scores: Record<string,number> = {};
  for (const { id } of locIds) {
    const cols = valid.map(k=>k.col).join(',');
    const { data: rv, error: rvErr } = await supabase
      .from(category + '_review')
      .select(`id,review_norm,${cols}`)
      .eq('id', id)
      .single();
    if (rvErr) {
      console.warn(`[4] review 조회 오류 (id=${id}):`, rvErr);
      continue;
    }
    if (!rv) continue;
    let s = Object.entries(weights)
      .reduce((sum,[c,w])=> sum + (rv[c]||0) * w, 0);
    s *= rv.review_norm || 1;
    scores[id] = s;
  }
  console.log('[4] 계산된 점수(scores) →', scores);

  // 5) 상위 20개 id
  const top = Object.entries(scores)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,20)
    .map(([id])=>id);
  console.log('[5] 상위 20개 id →', top);

  if (!top.length) return [];

  // 6) 최종 조회
  const { data: info, error: infoErr } = await supabase
    .from('information')
    .select(`id,place_name,road_address,x,y,${category}_rating(rating,visitor_review_count)`)
    .in('id', top);
  if (infoErr) {
    console.error('[6] 최종 정보 조회 오류:', infoErr);
    return [];
  }
  console.log('[6] 최종 조회된 장소 개수 →', info?.length);

  const results = info.map(i=>({
    id: i.id,
    place_name: i.place_name,
    road_address: i.road_address,
    x: i.x || 0,
    y: i.y || 0,
    rating: i[`${category}_rating`].rating || 0,
    visitor_review_count: i[`${category}_rating`].visitor_review_count || 0,
    category
  }));
  console.log('--- fetchWeightedResults 종료 → 결과 배열 →', results);
  return results;
}
