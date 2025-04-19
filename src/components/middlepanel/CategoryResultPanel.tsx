// middlepanel/CategoryResultPanel.tsx (이 행 삭제 금지)
import React, { useState, useEffect } from 'react';
import { fetchWeightedResults, PlaceResult } from '@/lib/travelFilter';
import { useMapContext } from '../rightpanel/MapContext';
import { Place } from '@/types/supabase';

interface CategoryResultPanelProps {
  category: '숙소' | '관광지' | '음식점' | '카페';
  locations: string[];
  keywords: string[];
  onClose: () => void;
}

const categoryKeyMap = {
  숙소: 'accommodation',
  관광지: 'landmark',
  음식점: 'restaurant',
  카페: 'cafe',
} as const;

// PlaceResult → Place 변환
const convertToPlace = (pr: PlaceResult): Place => ({
  id: pr.id,
  name: pr.place_name,
  address: pr.road_address,
  category: pr.category,
  // 좌표 필드가 없다면 0 으로 대체
  x: (pr as any).x ?? 0,
  y: (pr as any).y ?? 0,
  naverLink: '',
  instaLink: '',
  rating: pr.rating,
  reviewCount: pr.visitor_review_count,
});

const CategoryResultPanel: React.FC<CategoryResultPanelProps> = ({
  category,
  locations,
  keywords,
  onClose,
}) => {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [recommend, setRecommend] = useState<PlaceResult[]>([]);
  const [others, setOthers]       = useState<PlaceResult[]>([]);

  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchWeightedResults(
          categoryKeyMap[category],
          locations,
          keywords
        );

        const TOP_N = 4;
        setRecommend(results.slice(0, TOP_N));
        setOthers  (results.slice(TOP_N));

        clearMarkersAndUiElements();
        if (locations.length) panTo(locations[0]);

        addMarkers(recommend.map(convertToPlace), { highlight: true });
        addMarkers(others  .map(convertToPlace), { highlight: false });
      } catch (e) {
        console.error(e);
        setError((e as Error).message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, locations.join(','), keywords.join(',')]);

  return (
    <div
      className="
        fixed top-0 left-[300px] 
        w-[calc(100%-300px)] h-full 
        bg-white/90 z-50 
        p-4 overflow-auto
      "
    >
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{category} 추천 목록</h3>
        <button onClick={onClose} className="text-blue-600 hover:underline">
          닫기
        </button>
      </header>

      {loading && <p>로딩 중...</p>}
      {error   && <p className="text-red-500">오류: {error}</p>}

      {!loading && !error && (
        <>
          <section className="mb-6">
            <h4 className="font-medium mb-2">추천 ({recommend.length}개)</h4>
            <ul className="grid gap-2">
              {recommend.map((p) => (
                <li
                  key={p.id}
                  className="p-2 border-2 border-blue-500 rounded bg-blue-50"
                >
                  {p.place_name}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="font-medium mb-2">그 외 장소 ({others.length}개)</h4>
            <ul className="grid gap-2">
              {others.map((p) => (
                <li
                  key={p.id}
                  className="p-2 border border-gray-300 rounded bg-white"
                >
                  {p.place_name}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export default CategoryResultPanel;
