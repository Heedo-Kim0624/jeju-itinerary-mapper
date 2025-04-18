// middlepanel/CategoryResultPanel.tsx (이 행 삭제 금지)
import React, { useState, useEffect } from 'react';
import { fetchWeightedResults, PlaceResult } from '@/lib/travelFilter';
import { useMapContext } from '../rightpanel/MapContext';

interface CategoryResultPanelProps {
  category: '숙소' | '관광지' | '음식점' | '카페';
  locations: string[];    // e.g. ['애월', '조천']
  keywords: string[];     // e.g. ['깨끗해요', '뷰가 좋아요']
  onClose: () => void;
}

// 한글 카테고리 → Supabase 키
const categoryKeyMap = {
  숙소: 'accommodation',
  관광지: 'landmark',
  음식점: 'restaurant',
  카페: 'cafe',
} as const;

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

  // ★ MapContext API 변경 반영
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) 키워드에 맞춰 DB 조회
        const results = await fetchWeightedResults(
          categoryKeyMap[category],
          locations,
          keywords
        );

        // 2) 상위 4개 추천 / 나머지 일반 분리
        const TOP_N = 4;
        const rec = results.slice(0, TOP_N);
        const oth = results.slice(TOP_N);
        setRecommend(rec);
        setOthers(oth);

        // 3) 지도 초기화 및 마커 추가
        clearMarkersAndUiElements();                    // ← 기존 clearMarkers() 대신
        panTo(locations[0]);                            // ← 지역명 또는 좌표로 줌인
        addMarkers(rec, { highlight: true });           // ← 추천 핀
        addMarkers(oth, { highlight: false });          // ← 일반 핀
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
    <div className="absolute inset-0 bg-white/90 z-50 p-4 overflow-auto">
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
              {recommend.map(place => (
                <li
                  key={place.id}
                  className="p-2 border-2 border-blue-500 rounded bg-blue-50"
                >
                  {place.place_name}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="font-medium mb-2">그 외 장소 ({others.length}개)</h4>
            <ul className="grid gap-2">
              {others.map(place => (
                <li
                  key={place.id}
                  className="p-2 border border-gray-300 rounded bg-white"
                >
                  {place.place_name}
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
