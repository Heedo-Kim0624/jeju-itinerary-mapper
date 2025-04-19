
import React, { useState, useEffect } from 'react';
import { fetchWeightedResults, PlaceResult } from '@/lib/travelFilter';
import { useMapContext } from '../rightpanel/MapContext';
import { Place } from '@/types/supabase';
import PlaceList from './PlaceList';
import PlaceDetailsPopup from './PlaceDetailsPopup';

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
  // ★ MapContext API 변경 반영
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();
  // 페이징 · 선택 상태
  const [page, setPage] = useState(1);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

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
        setRecommend(results.slice(0, TOP_N));
        stOthers(results.slice(TOP_N));

        // 3) 지도 초기화 및 마커 추가
        clearMarkersAndUiElements();
        if (locations.length) panTo(locations[0]);

        // Place 타입으로 변환하여 전달
        addMarkers(results.slice(0, TOP_N).map(convertToPlace), { highlight: true });
        addMarkers(results.slice(TOP_N).map(convertToPlace), { highlight: false });
      } catch (e) {
        console.error(e);
        setError((e as Error).message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, locations.join(','), keywords.join(',')]);

  // 합쳐진 리스트 & 페이징 계산
  const allPlaces = [...recommend, ...others].map(convertToPlace);
  const totalPages = Math.ceil(allPlaces.length / 10);

  return (
    <div
      className="
        fixed inset-0 
        bg-black/50 
        z-50 
        flex items-center justify-center
      "
    >
      <div className="
        w-[calc(100%-300px)] 
        max-w-3xl
        h-[80vh]
        bg-white 
        rounded-lg 
        shadow-xl
        overflow-auto
        relative
      ">
        <header className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold">{category} 추천 목록</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            닫기
          </button>
        </header>

        <div className="p-4">
          {loading && <p>로딩 중...</p>}
          {error && <p className="text-red-500">오류: {error}</p>}

          {!loading && !error && (
            <PlaceList
              places={allPlaces}
              loading={loading}
              onSelectPlace={setSelectedPlace}
              selectedPlace={selectedPlace}
              page={page}
              onPageChange={setPage}
              totalPages={totalPages}
              orderedIds={recommend.map(r => r.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryResultPanel;
