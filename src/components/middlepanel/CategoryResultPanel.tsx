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

const convertToPlace = (pr: PlaceResult): Place => ({
  id: pr.id,
  name: pr.place_name,
  address: pr.road_address,
  category: pr.category,
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
  const [page, setPage] = useState(1);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

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
        setOthers(results.slice(TOP_N));

        clearMarkersAndUiElements();
        if (locations.length) panTo(locations[0]);

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

  const allPlaces = [...recommend, ...others].map(convertToPlace);
  const totalPages = Math.ceil(allPlaces.length / 10);

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md">
      <div className="h-full overflow-auto">
        <header className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{category} 추천 목록</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
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
