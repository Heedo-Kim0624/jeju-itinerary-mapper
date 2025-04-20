import React, { useState, useEffect } from 'react';
import { fetchWeightedResults, PlaceResult } from '@/lib/jeju/travelPromptUtils';
import { useMapContext } from '../rightpanel/MapContext';
import PlaceList from './PlaceList';
import PlaceDetailsPopup from './PlaceDetailsPopup';
import { useToast } from "@/hooks/use-toast";
import { Place } from '@/types/supabase';
import PlaceCard from './PlaceCard';

const categoryKeyMap = {
  '숙소': 'accommodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe',
} as const;

const convertToPlace = (pr: PlaceResult): Place => ({
  id: pr.id,
  name: pr.place_name,
  address: pr.road_address,
  category: pr.category,
  x: pr.x ?? 0,
  y: pr.y ?? 0,
  naverLink: '',
  instaLink: '',
  rating: pr.rating,
  reviewCount: pr.visitor_review_count,
});

const CategoryResultPanel: React.FC<{
  category: '숙소' | '관광지' | '음식점' | '카페';
  locations: string[];
  keywords: string[];
  onClose: () => void;
}> = ({ category, locations, keywords, onClose }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [page, setPage] = useState(1);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  useEffect(() => {
    const categoryDisplay = {
      '숙소': '숙소 🏨',
      '관광지': '관광지 🏛️',
      '음식점': '음식점 🍽️',
      '카페': '카페 ☕'
    };

    if (keywords.length > 0) {
      toast({
        title: `${categoryDisplay[category]} 키워드`,
        description: `선택된 키워드: ${keywords.join(', ')}`,
        duration: 5000,
      });
    }
  }, [category, keywords, toast]);

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

        // Split results into recommended (top 4) and nearby places
        const MAX_RECOMMENDATIONS = 4;
        setRecommendedPlaces(results.slice(0, MAX_RECOMMENDATIONS));
        setNearbyPlaces(results.slice(MAX_RECOMMENDATIONS));

        // Update map markers
        clearMarkersAndUiElements();
        if (locations.length) panTo(locations[0]);

        // Add markers with different styles for recommended vs nearby places
        const recommendedMarkers = results.slice(0, MAX_RECOMMENDATIONS).map(convertToPlace);
        const nearbyMarkers = results.slice(MAX_RECOMMENDATIONS).map(convertToPlace);
        
        addMarkers(recommendedMarkers, { highlight: true });
        addMarkers(nearbyMarkers, { highlight: false });

      } catch (e) {
        console.error(e);
        setError((e as Error).message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, locations.join(','), keywords.join(',')]);

  const allPlaces = [...recommendedPlaces, ...nearbyPlaces].map(convertToPlace);
  const totalPages = Math.ceil(allPlaces.length / 10);

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md">
      <div className="h-full flex flex-col">
        <header className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{category} 추천 목록</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            닫기
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {loading && <p>로딩 중...</p>}
          {error && <p className="text-red-500">오류: {error}</p>}

          {!loading && !error && recommendedPlaces.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium mb-3">✨ 추천 장소</h4>
              <div className="space-y-2">
                {recommendedPlaces.map(place => (
                  <PlaceCard
                    key={place.id}
                    place={convertToPlace(place)}
                    isSelected={selectedPlace?.id === place.id}
                    onSelect={(_place, checked) => {
                      if (checked) setSelectedPlace(convertToPlace(place));
                      else setSelectedPlace(null);
                    }}
                    onClick={() => setSelectedPlace(convertToPlace(place))}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && nearbyPlaces.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-3">📍 주변 장소</h4>
              <PlaceList
                places={nearbyPlaces.map(convertToPlace)}
                loading={loading}
                selectedPlace={selectedPlace}
                onSelectPlace={setSelectedPlace}
                page={page}
                onPageChange={setPage}
                totalPages={Math.ceil(nearbyPlaces.length / 10)}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 p-4 bg-white border-t">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            다음 단계로
          </button>
        </div>
      </div>

      {selectedPlace && (
        <PlaceDetailsPopup
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

export default CategoryResultPanel;
