import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { PlaceResult, fetchWeightedResults } from '../lib/travelFilter';
import { useMapContext } from './rightpanel/MapContext';
import PlaceList from './middlepanel/PlaceList';
import PlaceDetailsPopup from './middlepanel/PlaceDetailsPopup';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';

// 프롬프트 파싱 결과 타입 정의
interface ParsedPrompt {
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

const TravelFilterComponent: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [parsed, setParsed] = useState<ParsedPrompt | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlaceResult | null>(null);

  const mapCtx = useMapContext();
  const { toast } = useToast();

  // ==== 프롬프트 파싱 ====
  const parsePrompt = (input: string): ParsedPrompt | null => {
    try {
      const sched = input.match(/일정\[([\d\.]+),([\d:]+),([\d\.]+),([\d:]+)\]/);
      if (!sched) throw new Error('일정 형식 오류');
      const locs = input.match(/지역\[(.*?)\]/);
      if (!locs) throw new Error('지역 형식 오류');
      const locations = locs[1].split(',').map(s => s.trim());

      const catMap: Record<string, ParsedPrompt['category']> = {
        숙소: 'accommodation',
        관광지: 'landmark',
        음식점: 'restaurant',
        카페: 'cafe'
      };
      let category: ParsedPrompt['category'] | null = null;
      let ranked: string[] = [];
      let unranked: string[] = [];

      // 단일 카테고리 키워드 추출
      for (const [kor, eng] of Object.entries(catMap)) {
        // 예: 숙소[{a,b,c},d,e]
        const re = new RegExp(`${kor}\\[\\{([^\\}]+)\\}(?:,([^\\]]+))?\\]`);
        const m = input.match(re);
        if (m) {
          category = eng;
          ranked = m[1].split(',').map(s => s.trim());
          if (m[2]) unranked = m[2].split(',').map(s => s.trim());
          break;
        }
      }
      if (!category) throw new Error('카테고리 형식 오류');

      return {
        schedule: {
          startDate: sched[1], startTime: sched[2],
          endDate: sched[3], endTime: sched[4]
        },
        locations,
        category,
        rankedKeywords: ranked,
        unrankedKeywords: unranked
      };
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  };

  // ==== 제출 핸들러 ====
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSelected(null);
    mapCtx.clearMarkersAndUiElements();

    const p = parsePrompt(prompt);
    if (!p) { setLoading(false); return; }
    setParsed(p);

    // 토스트로 키워드 알림
    toast({
      title: `${p.category} 키워드`,
      description: `순위: ${p.rankedKeywords.join(', ')}\n추가: ${p.unrankedKeywords.join(', ')}`,
    });

    // 가중치 계산 + 장소 조회
    const allKeywords = [...p.rankedKeywords, ...p.unrankedKeywords];
    const places = await fetchWeightedResults(p.category, p.locations, allKeywords);
    setResults(places);

    // 지도 마커
    if (places.length && mapCtx) {
      const rec = places.slice(0, 4), oth = places.slice(4);
      mapCtx.addMarkers(rec, true);
      mapCtx.addMarkers(oth, false);
      mapCtx.panTo(places[0].x, places[0].y);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <form onSubmit={onSubmit} className="mb-4">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="일정[…], 지역[…], 숙소[{good_bedding,냉난방,good_breakfast},quiet_and_relax]"
          rows={4}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? '검색 중…' : '검색하기'}
        </Button>
      </form>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {parsed && (
        <div className="mb-4 p-3 bg-gray-100 border-l-4 border-blue-500">
          <p>일정: {parsed.schedule.startDate} {parsed.schedule.startTime} ~ {parsed.schedule.endDate} {parsed.schedule.endTime}</p>
          <p>지역: {parsed.locations.join(', ')}</p>
          <p>카테고리: {parsed.category}</p>
        </div>
      )}

      {results.length > 0 && (
        <PlaceList places={results} onPlaceClick={setSelected} />
      )}

      {selected && (
        <PlaceDetailsPopup place={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default TravelFilterComponent;
