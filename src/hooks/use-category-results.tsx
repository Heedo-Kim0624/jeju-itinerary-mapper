
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { fetchWeightedResults, PlaceResult } from '@/lib/jeju/placeUtils';
import { useMapContext } from '../components/rightpanel/MapContext';

type CategoryType = '숙소' | '관광지' | '음식점' | '카페';

const categoryKeyMap = {
  '숙소': 'accommodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe',
} as const;

// Helper function to convert ratings from text to number if needed
const parseRating = (rating: any): number => {
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const useCategoryResults = (
  category: CategoryType,
  locations: string[],
  keywords: string[],
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<PlaceResult[]>([]);
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  useEffect(() => {
    const categoryDisplay = {
      '숙소': '숙소 🏨',
      '관광지': '관광지 🏛️',
      '음식점': '음식점 🍽️',
      '카페': '카페 ☕'
    };

    if (keywords.length > 0) {
      toast(`${categoryDisplay[category]} 키워드: ${keywords.join(', ')}`);
    }
  }, [category, keywords]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Ensure we're using the correct category key mapping
        const categoryKey = categoryKeyMap[category];
        console.log(`Fetching results for category: ${category} (${categoryKey})`);
        
        const results = await fetchWeightedResults(
          categoryKey as any,
          locations,
          keywords
        );
        
        console.log(`Fetched ${results.length} results for ${category}`);
        console.log('첫 번째 결과의 가중치:', results[0]?.weight);

        // Process results to ensure rating and review count are numbers
        const processedResults = results.map(place => ({
          ...place,
          rating: parseRating(place.rating),
          visitor_review_count: place.visitor_review_count || 0,
          naverLink: place.naverLink ?? "",
          instaLink: place.instaLink ?? "",
          weight: place.weight // 명시적으로 가중치 포함
        }));

        const MAX_RECOMMENDATIONS = 4;
        setRecommendedPlaces(processedResults.slice(0, MAX_RECOMMENDATIONS));
        setNearbyPlaces(processedResults.slice(MAX_RECOMMENDATIONS));

        clearMarkersAndUiElements();
        
        if (locations.length) panTo(locations[0]);

        const recommendedMarkers = processedResults.slice(0, MAX_RECOMMENDATIONS).map(place => ({
          id: place.id,
          name: place.place_name,
          category: category,
          address: place.road_address,
          x: place.x,
          y: place.y,
          rating: place.rating,
          reviewCount: place.visitor_review_count,
          naverLink: place.naverLink ?? "",
          instaLink: place.instaLink ?? "",
          weight: place.weight // 지도 마커에도 가중치 포함
        }));
        
        addMarkers(recommendedMarkers, { highlight: true });

      } catch (e) {
        console.error(e);
        setError((e as Error).message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };
    
    if (locations.length > 0) {
      load();
    }
  }, [category, locations.join(','), keywords.join(',')]);

  return {
    loading,
    error,
    recommendedPlaces,
    nearbyPlaces,
  };
};
