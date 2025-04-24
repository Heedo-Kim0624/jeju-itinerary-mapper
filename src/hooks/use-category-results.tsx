
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
        console.log(`Using locations: ${locations.join(', ')}`);
        console.log(`Using keywords: ${keywords.join(', ')}`);
        
        const results = await fetchWeightedResults(
          categoryKey as any,
          locations,
          keywords
        );
        
        console.log(`Fetched ${results.length} results for ${category}`);
        
        // Log sorting by weight for debugging
        if (results.length > 0) {
          console.log("Top 5 results sorted by weight:");
          results.slice(0, 5).forEach((place, idx) => {
            console.log(`${idx+1}. ${place.place_name} - Weight: ${place.weight?.toFixed(3)}, Rating: ${place.rating}, Reviews: ${place.visitor_review_count}`);
          });
        }

        // Process results to ensure rating and review count are numbers
        const processedResults = results.map(place => ({
          ...place,
          rating: parseRating(place.rating),
          visitor_review_count: Number(place.visitor_review_count) || 0,
          naverLink: place.naverLink ?? "",
          instaLink: place.instaLink ?? "",
          weight: place.weight || 0 // 명시적으로 가중치 포함 (기본값 0)
        }));

        const MAX_RECOMMENDATIONS = 4;
        setRecommendedPlaces(processedResults.slice(0, MAX_RECOMMENDATIONS));
        setNearbyPlaces(processedResults.slice(MAX_RECOMMENDATIONS));

        clearMarkersAndUiElements();
        
        if (locations.length > 0) {
          panTo(locations[0]);
        }

        const recommendedMarkers = processedResults.slice(0, MAX_RECOMMENDATIONS).map(place => ({
          id: place.id,
          name: place.place_name,
          category: category,
          address: place.road_address,
          x: place.x,
          y: place.y,
          rating: place.rating || 0,
          reviewCount: place.visitor_review_count || 0,
          naverLink: place.naverLink ?? "",
          instaLink: place.instaLink ?? "",
          weight: place.weight // 지도 마커에도 가중치 포함
        }));
        
        addMarkers(recommendedMarkers, { highlight: true });

      } catch (e) {
        console.error('Error in useCategoryResults:', e);
        setError((e as Error).message || '데이터를 불러오는 중 오류가 발생했습니다');
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
