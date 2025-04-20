import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Place } from '@/types/supabase';
import { fetchWeightedResults, PlaceResult, convertToPlace } from '@/lib/jeju/travelPromptUtils';
import { useMapContext } from '../components/rightpanel/MapContext';

type CategoryType = '숙소' | '관광지' | '음식점' | '카페';

const categoryKeyMap = {
  '숙소': 'accommodation',
  '관광지': 'landmark',
  '음식점': 'restaurant',
  '카페': 'cafe',
} as const;

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
        const results = await fetchWeightedResults(
          categoryKeyMap[category],
          locations,
          keywords
        );

        const MAX_RECOMMENDATIONS = 4;
        setRecommendedPlaces(results.slice(0, MAX_RECOMMENDATIONS));
        setNearbyPlaces(results.slice(MAX_RECOMMENDATIONS));

        clearMarkersAndUiElements();
        
        if (locations.length) panTo(locations[0]);

        const recommendedMarkers = results.slice(0, MAX_RECOMMENDATIONS).map(convertToPlace);
        addMarkers(recommendedMarkers, { highlight: true });

      } catch (e) {
        console.error(e);
        setError((e as Error).message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, locations.join(','), keywords.join(',')]);

  return {
    loading,
    error,
    recommendedPlaces,
    nearbyPlaces,
  };
};
