
import React, { useState } from 'react';
import { fetchWeightedResults, parsePrompt, PlaceResult } from '@/lib/travelFilter';
import { useMapContext } from './rightpanel/MapContext';
import PlaceList from './middlepanel/PlaceList';  // Changed import
import PlaceDetailsPopup from './middlepanel/PlaceDetailsPopup';
import { Place } from '@/types/supabase';
import { useToast } from "@/hooks/use-toast";

const TravelFilterComponent: React.FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addMarkers, panTo } = useMapContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsed = parsePrompt(prompt);
      if (!parsed) {
        throw new Error('프롬프트 형식이 올바르지 않습니다.');
      }

      const results = await fetchWeightedResults(
        parsed.category,
        parsed.locations,
        parsed.rankedKeywords,
        parsed.unrankedKeywords
      );

      setPlaces(results);
      
      if (results.length > 0) {
        // Add markers to map - highlight top 4
        const recommendedPlaces = results.slice(0, 4).map(r => ({
          ...r,
          category: parsed.category,
          name: r.place_name,
          address: r.road_address,
          naverLink: '',
          instaLink: ''
        }));
        
        const otherPlaces = results.slice(4).map(r => ({
          ...r,
          category: parsed.category,
          name: r.place_name,
          address: r.road_address,
          naverLink: '',
          instaLink: ''
        }));

        addMarkers(recommendedPlaces, { highlight: true });
        addMarkers(otherPlaces, { highlight: false });

        // Pan to first location
        if (parsed.locations.length > 0) {
          panTo(parsed.locations[0]);
        }

        toast({
          title: "검색 완료",
          description: `${results.length}개의 장소를 찾았습니다.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.';
      setError(message);
      toast({
        variant: "destructive",
        title: "오류",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };

  return (
    <div className="travel-filter-container p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="form-group">
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            검색 프롬프트:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="일정[04.23,10:00,04.29,18:00], 지역[조천,애월], 숙소[{good_bedding,냉난방,good_breakfast},quiet_and_relax]"
            className="w-full p-2 border rounded-md"
            rows={5}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '검색 중...' : '검색하기'}
        </button>
      </form>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {places.length > 0 && (
        <PlaceList
          places={places.map(p => ({
            id: p.id,
            name: p.place_name,
            address: p.road_address,
            category: p.category,
            rating: p.rating,
            reviewCount: p.visitor_review_count,
            x: p.x,
            y: p.y,
            naverLink: '',
            instaLink: ''
          }))}
          loading={loading}
          selectedPlace={selectedPlace}
          onSelectPlace={handlePlaceSelect}
          page={1}
          onPageChange={() => {}}
          totalPages={1}
        />
      )}

      {selectedPlace && (
        <PlaceDetailsPopup
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

export default TravelFilterComponent;
